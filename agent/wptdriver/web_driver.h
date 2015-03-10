#pragma once

class WebDriver {
public:
  WebDriver(WptSettings& settings,
            WptTestDriver& test,
            WptStatus &status, 
            BrowserSettings& browser);
  bool RunAndWait();
  void Terminate();
	bool ReadClientError();
	bool ReadServerError();

private:
  bool SpawnWebDriverServer();
  bool SpawnWebDriverClient();
  void TerminateWebDriverServer();
  void TerminateWebDriverClient();

  bool CreateStdPipes(HANDLE *hRead, HANDLE *hWrite);
	
	bool ReadPipe(HANDLE hRead, CString &content);

  HANDLE _server_err_write, _server_err_read;
  HANDLE _client_err_write, _client_err_read;
  HANDLE  _browser_started_event;
  HANDLE  _browser_done_event;

  PROCESS_INFORMATION _server_info;
  PROCESS_INFORMATION _client_info;
  
  WptSettings& _settings;
  WptTestDriver& _test;
  WptStatus& _status;
  BrowserSettings& _browser;

  SECURITY_ATTRIBUTES null_dacl;
  SECURITY_DESCRIPTOR SD;

	CString _client_err;
	CString _server_err;
	
	int _pipe_index;
};