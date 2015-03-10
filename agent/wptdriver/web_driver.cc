#include "StdAfx.h"
#include "globals.h"
#include "web_driver.h"

static DWORD WINAPI ReadClientErrorProc(LPVOID lpvParam) {
	WebDriver *driver = (WebDriver *)lpvParam;

	driver->ReadClientError();
	return 0;
}

static DWORD WINAPI ReadServerErrorProc(LPVOID lpvParam) {
	WebDriver *driver = (WebDriver *)lpvParam;

	driver->ReadServerError();
	return 0;
}

WebDriver::WebDriver(WptSettings& settings,
                     WptTestDriver& test,
                     WptStatus &status, 
                     BrowserSettings& browser):
  _settings(settings),
  _test(test),
  _status(status),
  _browser(browser) {
  
  // create a NULL DACL we will use for allowing access to our active mutex
  ZeroMemory(&null_dacl, sizeof(null_dacl));
  null_dacl.nLength = sizeof(null_dacl);
  null_dacl.bInheritHandle = FALSE;
  if( InitializeSecurityDescriptor(&SD, SECURITY_DESCRIPTOR_REVISION) )
    if( SetSecurityDescriptorDacl(&SD, TRUE,(PACL)NULL, FALSE) )
      null_dacl.lpSecurityDescriptor = &SD;
 
  _browser_started_event = CreateEvent(&null_dacl, TRUE, FALSE,
                                       BROWSER_STARTED_EVENT);
  _browser_done_event = CreateEvent(&null_dacl, TRUE, FALSE,
                                    BROWSER_DONE_EVENT);
}

bool WebDriver::RunAndWait() {
  bool ok = true;
	DWORD client_exit_code = 0, server_exit_code = 0;
	HANDLE browser_process;

	// TODO (kk): Configure Ipfw.
	if (!_test.Start()) {
    _status.Set(_T("[webdriver] Error with internal test state."));
    _test._run_error = "Failed to launch webdriver test.";
    return false;
  }

  if (!_browser_started_event || !_browser_done_event) {
      _status.Set(_T("[webdriver] Error initializing browser event"));
      _test._run_error =
          "Failed to launch webdriver test.";
      return false;
  }

  ResetEvent(_browser_started_event);
  ResetEvent(_browser_done_event);

  if (!SpawnWebDriverServer()) {
    return false;
  }

  if (!SpawnWebDriverClient()) {
    return false;
  }
  // Now both the processes are spawned. We wait until something
  // interesting happens.
  if (WaitForSingleObject(_browser_started_event, 60000) !=
      WAIT_OBJECT_0) {
    _status.Set(_T("Error waiting for browser to launch"));
    _test._run_error = "Timed out waiting for the browser to start.";
    ok = false;
  }
  if (ok) {
		// Get a handle to the browser process.
		DWORD browser_pid = GetBrowserProcessId();
		if (browser_pid) {
			browser_process = OpenProcess(SYNCHRONIZE | PROCESS_TERMINATE,
																		FALSE, browser_pid);
		}
		if (!browser_process) {
			WptTrace(loglevel::kError, _T("Failed to acquire handle to the browser process."));
			_test._run_error = "Failed to acquire handle to the browser process.";
			ok = false;
		}
  }

	if (ok) {
		_status.Set(_T("Waiting up to %d seconds for the test to complete."),
			(_test._test_timeout / SECONDS_TO_MS) * 2);
		DWORD wait_time = _test._test_timeout * 2;
		HANDLE handles[] = {_browser_done_event, browser_process};
		// Wait for either the _browser_done_event to be set OR the browser
		// process to die, whichever happens first.
		WaitForMultipleObjects(2, handles, false, wait_time);
	}
  // Wait for the wd-runner process to die.
  WaitForSingleObject(_client_info.hProcess, 10000);

  // Now, terminate anything that might still be running.
  TerminateProcessById(_server_info.dwProcessId);
  TerminateProcessById(_client_info.dwProcessId);
  TerminateProcessesByName(_T("chromedriver.exe"));
  TerminateProcessesByName(_T("iedriverserver.exe"));
  // Execute browser cleanup batch file
  if(_browser._cleanupBatch && _browser._cleanupBatch.GetLength() > 0) {
    system(CT2A(_browser._cleanupBatch));
  }

	if (!GetExitCodeProcess(_client_info.hProcess, &client_exit_code)) {
		WptTrace(loglevel::kError, _T("[webdriver] WINAPI error GetExitCodeProcess: %u"), GetLastError());
	}

	if (!GetExitCodeProcess(_server_info.hProcess, &server_exit_code)) {
		WptTrace(loglevel::kError, _T("[webdriver] WINAPI error GetExitCodeProcess: %u"), GetLastError());
	}
	
	// Close all the handles.
  CloseHandle(_server_info.hProcess);
  CloseHandle(_server_info.hThread);
  CloseHandle(_client_info.hProcess);
  CloseHandle(_client_info.hThread);

  CloseHandle(_browser_started_event);
  CloseHandle(_browser_done_event);

	if (server_exit_code && _server_err.GetLength()) {
		_test._run_error = _server_err;
		WptTrace(loglevel::kError, _T("[webdriver] Error with webdriver server: ") + _server_err);
	}

	if (client_exit_code && _client_err.GetLength()) {
		_test._run_error += _client_err;
		WptTrace(loglevel::kError, _T("[webdriver] Error with webdriver client: ") + _client_err);
	}

	CloseHandle(_client_err_read);
	CloseHandle(_server_err_read);

	return ok && !client_exit_code && !server_exit_code;
}

bool WebDriver::CreateStdPipes(HANDLE *hRead, HANDLE *hWrite) {
	SECURITY_ATTRIBUTES sa_attr;

	sa_attr.nLength = sizeof(SECURITY_ATTRIBUTES);
	sa_attr.bInheritHandle = TRUE;
	sa_attr.lpSecurityDescriptor = NULL;

	// Create the stdout pipe. Child will write via out_write
	// and we will read via out_read.
	if (!CreatePipe(hRead, hWrite, &sa_attr, 0)) {
		WptTrace(loglevel::kError, _T("[webdirver] Failed to create pipes. Error: %u"),
			GetLastError());
		return false;
	}
	// Make sure the read end of the pipe is not inheritable by the
	// child.
	if (!SetHandleInformation(*hRead, HANDLE_FLAG_INHERIT, 0)) {
		WptTrace(loglevel::kError, _T("[webdriver] Failed to make handle uninheritable. Error: %u"),
			GetLastError());
		return false;
	}
	return true;
}

bool WebDriver::SpawnWebDriverServer() {
  STARTUPINFO si;
  TCHAR szCmdLine[] = _T("java.exe -jar selenium-server-standalone-2.45.0.jar -avoidProxy");
	DWORD thread_id;

  ZeroMemory(&si, sizeof(STARTUPINFO));

	if (!CreateStdPipes(&_server_err_read, &_server_err_write)) {
		_test._run_error = "Failed to launch the webdriver server.";
		return false;
	}
  
	si.cb = sizeof(STARTUPINFO);
	si.wShowWindow = SW_MINIMIZE;
	si.hStdInput = GetStdHandle(STD_INPUT_HANDLE);
	si.hStdOutput = GetStdHandle(STD_OUTPUT_HANDLE);
	si.hStdError = _server_err_write;
	si.dwFlags |= STARTF_USESTDHANDLES | STARTF_USESHOWWINDOW;

  _status.Set(_T("Launching: %s"), szCmdLine);
	if (!CreateProcess(NULL, szCmdLine, NULL, NULL, TRUE, 0, NULL,
    NULL, &si, &_server_info)) {
		WptTrace(loglevel::kError, _T("[webdriver] Failed to start webdriver server. Error: %u"),
			GetLastError());
    _test._run_error = "Failed to launch the webdriver server.";
    return false;
  }
	
	CloseHandle(_server_err_write);	// We won't be needing the write end of the pipe.

	if (!CreateThread(NULL, 0, ::ReadServerErrorProc, this, 0, &thread_id)) {
		WptTrace(loglevel::kError, _T("[webdriver] Failed to create thread to read server errors. Error: %u"),
			GetLastError());
		_test._run_error = "Failed to launch the webdriver server.";
		return false;
	}

  return true;
}

bool WebDriver::SpawnWebDriverClient() {
  STARTUPINFO si;
  TCHAR szCmdLine[32768];
  CAtlArray<CString> options;
	DWORD thread_id;

  // TODO (kk): Handle possible buffer overflow issues.
  // Basic command line
  lstrcpy(szCmdLine, 
	  CString(_T("java.exe -Dlogback.configurationFile=logback.xml -jar webdriver-runner-all-1.0.jar")));
  
  // Add the browser we are about to launch.
  lstrcat(szCmdLine, _T(" --browser ") + _settings._browser._browser);
  // Add test ID.
  lstrcat(szCmdLine, _T(" --test-id ") + _test._id);
  // Add test config file.
  lstrcat(szCmdLine, _T(" --test-config ") + CString("\"") + _test._test_file + CString("\""));
  if (!_test._script.GetLength()) {
	  // Script is empty. Test the said url.
	  lstrcat(szCmdLine, _T(" --test-url ") + _test._url);
  }
  // Get the command line options for the specific browser.
  _settings._browser.GetCmdLineOptions(_test, options);
  // Append the options to the existing command line.
  AppendCmdLineOptions(szCmdLine, options, _T(""));

  if (!_settings._browser._browser.CompareNoCase(_T("firefox"))) {
    lstrcat(szCmdLine, _T(" \"") + _settings._browser._profile_directory + _T("\""));
  }

  ZeroMemory(&si, sizeof(STARTUPINFO));

	if (!CreateStdPipes(&_client_err_read, &_client_err_write)) {
		_test._run_error = "Failed to launch the webdriver client.";
		return false;
	}

  si.cb = sizeof(STARTUPINFO);
	si.hStdInput = GetStdHandle(STD_INPUT_HANDLE);
	si.hStdOutput = GetStdHandle(STD_OUTPUT_HANDLE);
	si.hStdError = _client_err_write;		// so that we can read stderr.
	si.wShowWindow = SW_MINIMIZE;
  si.dwFlags |= STARTF_USESTDHANDLES | STARTF_USESHOWWINDOW;
  
	_status.Set(_T("Launching: %s"), szCmdLine);

	if (!CreateProcess(NULL, szCmdLine, NULL, NULL, TRUE, 0, NULL,
    NULL, &si, &_client_info)) {
    WptTrace(loglevel::kError, _T("[webdriver] Failed to start webdriver-runner. Error: %u"),
			GetLastError());
    _test._run_error = "Failed to launch the webdriver-runner client";
    return false;
  }

  CloseHandle(_client_err_write);	// We won't be needing the write end of the pipe.

	if (!CreateThread(NULL, 0, ::ReadClientErrorProc, this, 0, &thread_id)) {
		WptTrace(loglevel::kError, _T("[webdriver] Failed to create thread to read client errors. Error: %u"),
			GetLastError());
		_test._run_error = "Failed to launch the webdriver-runner client";
		return false;
	}

	return true;
}

bool WebDriver::ReadClientError() {
	return ReadPipe(_client_err_read, _client_err);
}

bool WebDriver::ReadServerError() {
	return ReadPipe(_server_err_read, _server_err);
}

bool WebDriver::ReadPipe(HANDLE hRead, CString &content) {
	DWORD bytesRead = -1;
	char buf[1024];

	while (true) {
		if (!ReadFile(hRead, &buf, sizeof(buf), &bytesRead, NULL)
			|| !bytesRead) {
			DWORD err_code = GetLastError();
			if (err_code == ERROR_BROKEN_PIPE) {
				break;
			} else {
				// Something bad happened.
				WptTrace(loglevel::kError, _T("[webdriver] WINAPI error ReadFile. Error: %u"), GetLastError());
				return false;
			}
		}
		content.Append(CString(buf), bytesRead);
	}
	
	return true;
}