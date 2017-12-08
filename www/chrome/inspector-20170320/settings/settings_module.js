Settings.EditFileSystemView=class extends UI.VBox{constructor(fileSystemPath){super(true);this.registerRequiredCSS('settings/editFileSystemView.css');this._fileSystemPath=fileSystemPath;this._eventListeners=[Workspace.fileSystemMapping.addEventListener(Workspace.FileSystemMapping.Events.FileMappingAdded,this._update,this),Workspace.fileSystemMapping.addEventListener(Workspace.FileSystemMapping.Events.FileMappingRemoved,this._update,this),Workspace.isolatedFileSystemManager.addEventListener(Workspace.IsolatedFileSystemManager.Events.ExcludedFolderAdded,this._update,this),Workspace.isolatedFileSystemManager.addEventListener(Workspace.IsolatedFileSystemManager.Events.ExcludedFolderRemoved,this._update,this)];if(!Runtime.experiments.isEnabled('persistence2')){this._mappingsList=new UI.ListWidget(this);this._mappingsList.element.classList.add('file-system-list');this._mappingsList.registerRequiredCSS('settings/editFileSystemView.css');var mappingsPlaceholder=createElementWithClass('div','file-system-list-empty');var mappingsHeader=this.contentElement.createChild('div','file-system-header');mappingsHeader.createChild('div','file-system-header-text').textContent=Common.UIString('Mappings');mappingsPlaceholder.textContent=Common.UIString('None');mappingsHeader.appendChild(UI.createTextButton(Common.UIString('Add'),this._addMappingButtonClicked.bind(this),'add-button'));this._mappingsList.setEmptyPlaceholder(mappingsPlaceholder);this._mappingsList.show(this.contentElement);}
var excludedFoldersHeader=this.contentElement.createChild('div','file-system-header');excludedFoldersHeader.createChild('div','file-system-header-text').textContent=Common.UIString('Excluded folders');excludedFoldersHeader.appendChild(UI.createTextButton(Common.UIString('Add'),this._addExcludedFolderButtonClicked.bind(this),'add-button'));this._excludedFoldersList=new UI.ListWidget(this);this._excludedFoldersList.element.classList.add('file-system-list');this._excludedFoldersList.registerRequiredCSS('settings/editFileSystemView.css');var excludedFoldersPlaceholder=createElementWithClass('div','file-system-list-empty');excludedFoldersPlaceholder.textContent=Common.UIString('None');this._excludedFoldersList.setEmptyPlaceholder(excludedFoldersPlaceholder);this._excludedFoldersList.show(this.contentElement);this.contentElement.tabIndex=0;this._update();}
dispose(){Common.EventTarget.removeEventListeners(this._eventListeners);}
_update(){if(this._muteUpdate)
return;this._mappings=[];if(Runtime.experiments.isEnabled('persistence2'))
return;this._mappingsList.clear();var mappings=Workspace.fileSystemMapping.mappingEntries(this._fileSystemPath);for(var entry of mappings){if(entry.configurable){this._mappingsList.appendItem(entry,true);this._mappings.push(entry);}}
for(var entry of mappings){if(!entry.configurable){this._mappingsList.appendItem(entry,false);this._mappings.push(entry);}}
this._excludedFoldersList.clear();this._excludedFolders=[];for(var folder of Workspace.isolatedFileSystemManager.fileSystem(this._fileSystemPath).excludedFolders().values()){this._excludedFolders.push(folder);this._excludedFoldersList.appendItem(folder,true);}
for(var folder of Workspace.isolatedFileSystemManager.fileSystem(this._fileSystemPath).nonConfigurableExcludedFolders().values()){this._excludedFolders.push(folder);this._excludedFoldersList.appendItem(folder,false);}}
_addMappingButtonClicked(){var entry=new Workspace.FileSystemMapping.Entry(this._fileSystemPath,'','',true);this._mappingsList.addNewItem(0,entry);}
_addExcludedFolderButtonClicked(){this._excludedFoldersList.addNewItem(0,'');}
renderItem(item,editable){var element=createElementWithClass('div','file-system-list-item');if(!editable)
element.classList.add('locked');if(item instanceof Workspace.FileSystemMapping.Entry){var entry=(item);var urlPrefix=entry.configurable?entry.urlPrefix:Common.UIString('%s (via .devtools)',entry.urlPrefix);var urlPrefixElement=element.createChild('div','file-system-value');urlPrefixElement.textContent=urlPrefix;urlPrefixElement.title=urlPrefix;element.createChild('div','file-system-separator');var pathPrefixElement=element.createChild('div','file-system-value');pathPrefixElement.textContent=entry.pathPrefix;pathPrefixElement.title=entry.pathPrefix;}else{var pathPrefix=(editable?item:Common.UIString('%s (via .devtools)',item));var pathPrefixElement=element.createChild('div','file-system-value');pathPrefixElement.textContent=pathPrefix;pathPrefixElement.title=pathPrefix;}
element.createChild('div','file-system-locked').title=Common.UIString('From .devtools file');return element;}
removeItemRequested(item,index){if(item instanceof Workspace.FileSystemMapping.Entry){var entry=this._mappings[index];Workspace.fileSystemMapping.removeFileMapping(entry.fileSystemPath,entry.urlPrefix,entry.pathPrefix);}else{Workspace.isolatedFileSystemManager.fileSystem(this._fileSystemPath).removeExcludedFolder(this._excludedFolders[index]);}}
commitEdit(item,editor,isNew){this._muteUpdate=true;if(item instanceof Workspace.FileSystemMapping.Entry){var entry=(item);if(!isNew)
Workspace.fileSystemMapping.removeFileMapping(this._fileSystemPath,entry.urlPrefix,entry.pathPrefix);Workspace.fileSystemMapping.addFileMapping(this._fileSystemPath,this._normalizePrefix(editor.control('urlPrefix').value),this._normalizePrefix(editor.control('pathPrefix').value));}else{if(!isNew){Workspace.isolatedFileSystemManager.fileSystem(this._fileSystemPath).removeExcludedFolder((item));}
Workspace.isolatedFileSystemManager.fileSystem(this._fileSystemPath).addExcludedFolder(this._normalizePrefix(editor.control('pathPrefix').value));}
this._muteUpdate=false;this._update();}
beginEdit(item){if(item instanceof Workspace.FileSystemMapping.Entry){var entry=(item);var editor=this._createMappingEditor();editor.control('urlPrefix').value=entry.urlPrefix;editor.control('pathPrefix').value=entry.pathPrefix;return editor;}else{var editor=this._createExcludedFolderEditor();editor.control('pathPrefix').value=item;return editor;}}
_createMappingEditor(){if(this._mappingEditor)
return this._mappingEditor;var editor=new UI.ListWidget.Editor();this._mappingEditor=editor;var content=editor.contentElement();var titles=content.createChild('div','file-system-edit-row');titles.createChild('div','file-system-value').textContent=Common.UIString('URL prefix');titles.createChild('div','file-system-separator file-system-separator-invisible');titles.createChild('div','file-system-value').textContent=Common.UIString('Folder path');var fields=content.createChild('div','file-system-edit-row');fields.createChild('div','file-system-value').appendChild(editor.createInput('urlPrefix','text','http://localhost:8000/url',urlPrefixValidator.bind(this)));fields.createChild('div','file-system-separator file-system-separator-invisible');fields.createChild('div','file-system-value').appendChild(editor.createInput('pathPrefix','text','/path/to/folder/',pathPrefixValidator.bind(this)));return editor;function urlPrefixValidator(item,index,input){var prefix=this._normalizePrefix(input.value);for(var i=0;i<this._mappings.length;++i){if(i!==index&&this._mappings[i].configurable&&this._mappings[i].urlPrefix===prefix)
return false;}
return!!prefix;}
function pathPrefixValidator(item,index,input){var prefix=this._normalizePrefix(input.value);for(var i=0;i<this._mappings.length;++i){if(i!==index&&this._mappings[i].configurable&&this._mappings[i].pathPrefix===prefix)
return false;}
return!!prefix;}}
_createExcludedFolderEditor(){if(this._excludedFolderEditor)
return this._excludedFolderEditor;var editor=new UI.ListWidget.Editor();this._excludedFolderEditor=editor;var content=editor.contentElement();var titles=content.createChild('div','file-system-edit-row');titles.createChild('div','file-system-value').textContent=Common.UIString('Folder path');var fields=content.createChild('div','file-system-edit-row');fields.createChild('div','file-system-value').appendChild(editor.createInput('pathPrefix','text','/path/to/folder/',pathPrefixValidator.bind(this)));return editor;function pathPrefixValidator(item,index,input){var prefix=this._normalizePrefix(input.value);var configurableCount=Workspace.isolatedFileSystemManager.fileSystem(this._fileSystemPath).excludedFolders().size;for(var i=0;i<configurableCount;++i){if(i!==index&&this._excludedFolders[i]===prefix)
return false;}
return!!prefix;}}
_normalizePrefix(prefix){if(!prefix)
return'';return prefix+(prefix[prefix.length-1]==='/'?'':'/');}};;Settings.SettingsScreen=class extends UI.VBox{constructor(){super(true);this.registerRequiredCSS('settings/settingsScreen.css');this.contentElement.tabIndex=0;this.contentElement.classList.add('help-window-main');this.contentElement.classList.add('vbox');var settingsLabelElement=createElement('div');UI.createShadowRootWithCoreStyles(settingsLabelElement,'settings/settingsScreen.css').createChild('div','settings-window-title').textContent=Common.UIString('Settings');this._tabbedLocation=UI.viewManager.createTabbedLocation(()=>Settings.SettingsScreen._showSettingsScreen(),'settings-view');var tabbedPane=this._tabbedLocation.tabbedPane();tabbedPane.leftToolbar().appendToolbarItem(new UI.ToolbarItem(settingsLabelElement));tabbedPane.setShrinkableTabs(false);tabbedPane.setVerticalTabLayout(true);var shortcutsView=new UI.SimpleView(Common.UIString('Shortcuts'));UI.shortcutsScreen.createShortcutsTabView().show(shortcutsView.element);this._tabbedLocation.appendView(shortcutsView);tabbedPane.show(this.contentElement);this.element.addEventListener('keydown',this._keyDown.bind(this),false);this._developerModeCounter=0;this.setDefaultFocusedElement(this.contentElement);}
static _showSettingsScreen(name){var settingsScreen=(self.runtime.sharedInstance(Settings.SettingsScreen));if(settingsScreen.isShowing())
return;var dialog=new UI.Dialog();dialog.addCloseButton();settingsScreen.show(dialog.contentElement);dialog.show();settingsScreen._selectTab(name||'preferences');}
resolveLocation(locationName){return this._tabbedLocation;}
_selectTab(name){UI.viewManager.showView(name);}
_keyDown(event){var shiftKeyCode=16;if(event.keyCode===shiftKeyCode&&++this._developerModeCounter>5)
this.contentElement.classList.add('settings-developer-mode');}};Settings.SettingsTab=class extends UI.VBox{constructor(name,id){super();this.element.classList.add('settings-tab-container');if(id)
this.element.id=id;var header=this.element.createChild('header');header.createChild('h3').createTextChild(name);this.containerElement=this.element.createChild('div','help-container-wrapper').createChild('div','settings-tab help-content help-container');}
_appendSection(name){var block=this.containerElement.createChild('div','help-block');if(name)
block.createChild('div','help-section-title').textContent=name;return block;}
_createSelectSetting(name,options,setting){var p=createElement('p');p.createChild('label').textContent=name;var select=p.createChild('select','chrome-select');var settingValue=setting.get();for(var i=0;i<options.length;++i){var option=options[i];select.add(new Option(option[0],option[1]));if(settingValue===option[1])
select.selectedIndex=i;}
function changeListener(e){setting.set(options[select.selectedIndex][1]);}
select.addEventListener('change',changeListener,false);return p;}};Settings.GenericSettingsTab=class extends Settings.SettingsTab{constructor(){super(Common.UIString('Preferences'),'preferences-tab-content');var explicitSectionOrder=['','Appearance','Elements','Sources','Network','Profiler','Console','Extensions'];this._nameToSection=new Map();this._nameToSettingElement=new Map();for(var sectionName of explicitSectionOrder)
this._sectionElement(sectionName);self.runtime.extensions('setting').forEach(this._addSetting.bind(this));self.runtime.extensions(UI.SettingUI).forEach(this._addSettingUI.bind(this));this._appendSection().appendChild(UI.createTextButton(Common.UIString('Restore defaults and reload'),restoreAndReload));function restoreAndReload(){Common.settings.clearAll();Components.reload();}}
static isSettingVisible(extension){var descriptor=extension.descriptor();if(!('title'in descriptor))
return false;if(!('category'in descriptor))
return false;return true;}
_addSetting(extension){if(!Settings.GenericSettingsTab.isSettingVisible(extension))
return;var descriptor=extension.descriptor();var sectionName=descriptor['category'];var settingName=descriptor['settingName'];var setting=Common.moduleSetting(settingName);var uiTitle=Common.UIString(extension.title());var sectionElement=this._sectionElement(sectionName);var settingControl;switch(descriptor['settingType']){case'boolean':settingControl=UI.SettingsUI.createSettingCheckbox(uiTitle,setting);break;case'enum':var descriptorOptions=descriptor['options'];var options=new Array(descriptorOptions.length);for(var i=0;i<options.length;++i){var optionName=descriptorOptions[i]['raw']?descriptorOptions[i]['text']:Common.UIString(descriptorOptions[i]['text']);options[i]=[optionName,descriptorOptions[i]['value']];}
settingControl=this._createSelectSetting(uiTitle,options,setting);break;default:console.error('Invalid setting type: '+descriptor['settingType']);return;}
this._nameToSettingElement.set(settingName,settingControl);sectionElement.appendChild((settingControl));}
_addSettingUI(extension){var descriptor=extension.descriptor();var sectionName=descriptor['category']||'';extension.instance().then(appendCustomSetting.bind(this));function appendCustomSetting(object){var settingUI=(object);var element=settingUI.settingElement();if(element)
this._sectionElement(sectionName).appendChild(element);}}
_sectionElement(sectionName){var sectionElement=this._nameToSection.get(sectionName);if(!sectionElement){var uiSectionName=sectionName&&Common.UIString(sectionName);sectionElement=this._appendSection(uiSectionName);this._nameToSection.set(sectionName,sectionElement);}
return sectionElement;}};Settings.WorkspaceSettingsTab=class extends Settings.SettingsTab{constructor(){super(Common.UIString('Workspace'),'workspace-tab-content');Workspace.isolatedFileSystemManager.addEventListener(Workspace.IsolatedFileSystemManager.Events.FileSystemAdded,this._fileSystemAdded,this);Workspace.isolatedFileSystemManager.addEventListener(Workspace.IsolatedFileSystemManager.Events.FileSystemRemoved,this._fileSystemRemoved,this);var folderExcludePatternInput=this._createFolderExcludePatternInput();folderExcludePatternInput.classList.add('folder-exclude-pattern');this.containerElement.appendChild(folderExcludePatternInput);if(Runtime.experiments.isEnabled('persistence2')){var div=this.containerElement.createChild('div','settings-info-message');div.createTextChild(Common.UIString('Mappings are inferred automatically via the \'Persistence 2.0\' experiment. Please '));div.appendChild(UI.createExternalLink('https://bugs.chromium.org/p/chromium/issues/entry?template=Defect%20report%20from%20user&components=Platform%3EDevTools%3EAuthoring&comment=DevTools%20failed%20to%20link%20network%20resource%20to%20filesystem.%0A%0APlatform%3A%20%3CLinux%2FWin%2FMac%3E%0AChrome%20version%3A%20%3Cyour%20chrome%20version%3E%0A%0AWhat%20are%20the%20details%20of%20your%20project%3F%0A-%20Source%20code%20(if%20any)%3A%20http%3A%2F%2Fgithub.com%2Fexample%2Fexample%0A-%20Build%20System%3A%20gulp%2Fgrunt%2Fwebpack%2Frollup%2F...%0A-%20HTTP%20server%3A%20node%20HTTP%2Fnginx%2Fapache...%0A%0AAssets%20failed%20to%20link%20(or%20incorrectly%20linked)%3A%0A1.%0A2.%0A3.%0A%0AIf%20possible%2C%20please%20attach%20a%20screenshot%20of%20network%20sources%20navigator%20which%20should%0Ashow%20which%20resources%20failed%20to%20map',Common.UIString('report')));div.createTextChild(Common.UIString(' any bugs.'));}
this._fileSystemsListContainer=this.containerElement.createChild('div','');this.containerElement.appendChild(UI.createTextButton(Common.UIString('Add folder\u2026'),this._addFileSystemClicked.bind(this)));this._elementByPath=new Map();this._mappingViewByPath=new Map();var fileSystems=Workspace.isolatedFileSystemManager.fileSystems();for(var i=0;i<fileSystems.length;++i)
this._addItem(fileSystems[i]);}
_createFolderExcludePatternInput(){var p=createElement('p');var labelElement=p.createChild('label');labelElement.textContent=Common.UIString('Folder exclude pattern');var inputElement=p.createChild('input');inputElement.type='text';inputElement.style.width='270px';var folderExcludeSetting=Workspace.isolatedFileSystemManager.workspaceFolderExcludePatternSetting();var setValue=UI.bindInput(inputElement,folderExcludeSetting.set.bind(folderExcludeSetting),regexValidator,false);folderExcludeSetting.addChangeListener(()=>setValue.call(null,folderExcludeSetting.get()));setValue(folderExcludeSetting.get());return p;function regexValidator(value){var regex;try{regex=new RegExp(value);}catch(e){}
return!!regex;}}
_addItem(fileSystem){var element=this._renderFileSystem(fileSystem);this._elementByPath.set(fileSystem.path(),element);this._fileSystemsListContainer.appendChild(element);var mappingView=new Settings.EditFileSystemView(fileSystem.path());this._mappingViewByPath.set(fileSystem.path(),mappingView);mappingView.element.classList.add('file-system-mapping-view');mappingView.show(element);}
_renderFileSystem(fileSystem){var fileSystemPath=fileSystem.path();var lastIndexOfSlash=fileSystemPath.lastIndexOf(Host.isWin()?'\\':'/');var folderName=fileSystemPath.substr(lastIndexOfSlash+1);var element=createElementWithClass('div','file-system-container');var header=element.createChild('div','file-system-header');header.createChild('div','file-system-name').textContent=folderName;var path=header.createChild('div','file-system-path');path.textContent=fileSystemPath;path.title=fileSystemPath;var toolbar=new UI.Toolbar('');var button=new UI.ToolbarButton(Common.UIString('Remove'),'largeicon-delete');button.addEventListener(UI.ToolbarButton.Events.Click,this._removeFileSystemClicked.bind(this,fileSystem));toolbar.appendToolbarItem(button);header.appendChild(toolbar.element);return element;}
_removeFileSystemClicked(fileSystem){Workspace.isolatedFileSystemManager.removeFileSystem(fileSystem);}
_addFileSystemClicked(){Workspace.isolatedFileSystemManager.addFileSystem();}
_fileSystemAdded(event){var fileSystem=(event.data);this._addItem(fileSystem);}
_fileSystemRemoved(event){var fileSystem=(event.data);var mappingView=this._mappingViewByPath.get(fileSystem.path());if(mappingView){mappingView.dispose();this._mappingViewByPath.delete(fileSystem.path());}
var element=this._elementByPath.get(fileSystem.path());if(element){this._elementByPath.delete(fileSystem.path());element.remove();}}};Settings.ExperimentsSettingsTab=class extends Settings.SettingsTab{constructor(){super(Common.UIString('Experiments'),'experiments-tab-content');var experiments=Runtime.experiments.allConfigurableExperiments();if(experiments.length){var experimentsSection=this._appendSection();experimentsSection.appendChild(this._createExperimentsWarningSubsection());for(var i=0;i<experiments.length;++i)
experimentsSection.appendChild(this._createExperimentCheckbox(experiments[i]));}}
_createExperimentsWarningSubsection(){var subsection=createElement('div');var warning=subsection.createChild('span','settings-experiments-warning-subsection-warning');warning.textContent=Common.UIString('WARNING:');subsection.createTextChild(' ');var message=subsection.createChild('span','settings-experiments-warning-subsection-message');message.textContent=Common.UIString('These experiments could be dangerous and may require restart.');return subsection;}
_createExperimentCheckbox(experiment){var label=UI.createCheckboxLabel(Common.UIString(experiment.title),experiment.isEnabled());var input=label.checkboxElement;input.name=experiment.name;function listener(){experiment.setEnabled(input.checked);}
input.addEventListener('click',listener,false);var p=createElement('p');p.className=experiment.hidden&&!experiment.isEnabled()?'settings-experiment-hidden':'';p.appendChild(label);return p;}};Settings.SettingsScreen.ActionDelegate=class{handleAction(context,actionId){switch(actionId){case'settings.show':Settings.SettingsScreen._showSettingsScreen();return true;case'settings.documentation':InspectorFrontendHost.openInNewTab('https://developers.google.com/web/tools/chrome-devtools/');return true;case'settings.shortcuts':Settings.SettingsScreen._showSettingsScreen(Common.UIString('Shortcuts'));return true;}
return false;}};Settings.SettingsScreen.Revealer=class{reveal(object){console.assert(object instanceof Common.Setting);var setting=(object);var success=false;self.runtime.extensions('setting').forEach(revealModuleSetting);self.runtime.extensions(UI.SettingUI).forEach(revealSettingUI);self.runtime.extensions('view').forEach(revealSettingsView);return success?Promise.resolve():Promise.reject();function revealModuleSetting(extension){if(!Settings.GenericSettingsTab.isSettingVisible(extension))
return;if(extension.descriptor()['settingName']===setting.name){InspectorFrontendHost.bringToFront();Settings.SettingsScreen._showSettingsScreen();success=true;}}
function revealSettingUI(extension){var settings=extension.descriptor()['settings'];if(settings&&settings.indexOf(setting.name)!==-1){InspectorFrontendHost.bringToFront();Settings.SettingsScreen._showSettingsScreen();success=true;}}
function revealSettingsView(extension){var location=extension.descriptor()['location'];if(location!=='settings-view')
return;var settings=extension.descriptor()['settings'];if(settings&&settings.indexOf(setting.name)!==-1){InspectorFrontendHost.bringToFront();Settings.SettingsScreen._showSettingsScreen(extension.descriptor()['id']);success=true;}}}};;Settings.FrameworkBlackboxSettingsTab=class extends UI.VBox{constructor(){super(true);this.registerRequiredCSS('settings/frameworkBlackboxSettingsTab.css');this.contentElement.createChild('div','header').textContent=Common.UIString('Framework Blackbox Patterns');this.contentElement.createChild('div','blackbox-content-scripts').appendChild(UI.SettingsUI.createSettingCheckbox(Common.UIString('Blackbox content scripts'),Common.moduleSetting('skipContentScripts'),true));this._blackboxLabel=Common.UIString('Blackbox');this._disabledLabel=Common.UIString('Disabled');this._list=new UI.ListWidget(this);this._list.element.classList.add('blackbox-list');this._list.registerRequiredCSS('settings/frameworkBlackboxSettingsTab.css');var placeholder=createElementWithClass('div','blackbox-list-empty');placeholder.textContent=Common.UIString('No blackboxed patterns');this._list.setEmptyPlaceholder(placeholder);this._list.show(this.contentElement);var addPatternButton=UI.createTextButton(Common.UIString('Add pattern...'),this._addButtonClicked.bind(this),'add-button');this.contentElement.appendChild(addPatternButton);this._setting=Common.moduleSetting('skipStackFramesPattern');this._setting.addChangeListener(this._settingUpdated,this);this.setDefaultFocusedElement(addPatternButton);this.contentElement.tabIndex=0;}
wasShown(){super.wasShown();this._settingUpdated();}
_settingUpdated(){this._list.clear();var patterns=this._setting.getAsArray();for(var i=0;i<patterns.length;++i)
this._list.appendItem(patterns[i],true);}
_addButtonClicked(){this._list.addNewItem(this._setting.getAsArray().length,{pattern:'',disabled:false});}
renderItem(item,editable){var element=createElementWithClass('div','blackbox-list-item');var pattern=element.createChild('div','blackbox-pattern');pattern.textContent=item.pattern;pattern.title=item.pattern;element.createChild('div','blackbox-separator');element.createChild('div','blackbox-behavior').textContent=item.disabled?this._disabledLabel:this._blackboxLabel;if(item.disabled)
element.classList.add('blackbox-disabled');return element;}
removeItemRequested(item,index){var patterns=this._setting.getAsArray();patterns.splice(index,1);this._setting.setAsArray(patterns);}
commitEdit(item,editor,isNew){item.pattern=editor.control('pattern').value.trim();item.disabled=editor.control('behavior').value===this._disabledLabel;var list=this._setting.getAsArray();if(isNew)
list.push(item);this._setting.setAsArray(list);}
beginEdit(item){var editor=this._createEditor();editor.control('pattern').value=item.pattern;editor.control('behavior').value=item.disabled?this._disabledLabel:this._blackboxLabel;return editor;}
_createEditor(){if(this._editor)
return this._editor;var editor=new UI.ListWidget.Editor();this._editor=editor;var content=editor.contentElement();var titles=content.createChild('div','blackbox-edit-row');titles.createChild('div','blackbox-pattern').textContent=Common.UIString('Pattern');titles.createChild('div','blackbox-separator blackbox-separator-invisible');titles.createChild('div','blackbox-behavior').textContent=Common.UIString('Behavior');var fields=content.createChild('div','blackbox-edit-row');fields.createChild('div','blackbox-pattern').appendChild(editor.createInput('pattern','text','/framework\\.js$',patternValidator.bind(this)));fields.createChild('div','blackbox-separator blackbox-separator-invisible');fields.createChild('div','blackbox-behavior').appendChild(editor.createSelect('behavior',[this._blackboxLabel,this._disabledLabel],behaviorValidator));return editor;function patternValidator(item,index,input){var pattern=input.value.trim();var patterns=this._setting.getAsArray();for(var i=0;i<patterns.length;++i){if(i!==index&&patterns[i].pattern===pattern)
return false;}
var regex;try{regex=new RegExp(pattern);}catch(e){}
return!!(pattern&&regex);}
function behaviorValidator(item,index,input){return true;}}};;Runtime.cachedResources["settings/editFileSystemView.css"]="/*\n * Copyright 2015 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.file-system-header {\n    display: flex;\n    flex-direction: row;\n    align-items: center;\n    flex: auto;\n    margin: 10px 0;\n}\n\n.file-system-header-text {\n    flex: auto;\n}\n\n.add-button {\n    margin-left: 10px;\n    align-self: flex-start;\n}\n\n.file-system-list {\n    flex: auto;\n}\n\n.file-system-list-empty {\n    flex: auto;\n    height: 30px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    text-align: center;\n}\n\n.file-system-list-item {\n    padding: 3px 5px 3px 5px;\n    height: 30px;\n    display: flex;\n    align-items: center;\n    flex: auto 1 1;\n}\n\n.file-system-value {\n    white-space: nowrap;\n    text-overflow: ellipsis;\n    -webkit-user-select: none;\n    color: #222;\n    flex: 1 1 0px;\n    overflow: hidden;\n}\n\n.file-system-separator {\n    flex: 0 0 1px;\n    background-color: rgb(231, 231, 231);\n    height: 30px;\n    margin: 0 4px;\n}\n\n.file-system-separator-invisible {\n    visibility: hidden;\n    height: 100% !important;\n}\n\n.file-system-edit-row {\n    flex: none;\n    display: flex;\n    flex-direction: row;\n    margin: 6px 5px;\n    align-items: center;\n}\n\n.file-system-edit-row input {\n    width: 100%;\n    text-align: inherit;\n}\n\n.file-system-locked {\n    flex: none;\n    visibility: hidden;\n}\n\n.file-system-locked:after {\n    content: \"\\1F512\";\n}\n\n.file-system-list-item.locked .file-system-locked {\n    visibility: visible;\n}\n\n/*# sourceURL=settings/editFileSystemView.css */";Runtime.cachedResources["settings/frameworkBlackboxSettingsTab.css"]="/*\n * Copyright 2015 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n:host {\n    overflow:hidden;\n}\n\n.header {\n    padding: 0 0 6px;\n    border-bottom: 1px solid #EEEEEE;\n    font-size: 18px;\n    font-weight: normal;\n    flex: none;\n}\n\n.blackbox-content-scripts {\n    margin-top: 10px;\n    flex: none;\n}\n\n.add-button {\n    margin: 10px 0;\n    align-self: flex-start;\n    flex: none;\n}\n\n.blackbox-list {\n    margin-top: 10px;\n    max-width: 500px;\n    flex: 0 1 auto;\n    min-height: 30px;\n}\n\n.blackbox-list-empty {\n    flex: auto;\n    height: 30px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n}\n\n.blackbox-list-item {\n    padding: 3px 5px 3px 5px;\n    height: 30px;\n    display: flex;\n    align-items: center;\n    position: relative;\n    flex: auto 1 1;\n}\n\n.blackbox-pattern {\n    white-space: nowrap;\n    text-overflow: ellipsis;\n    -webkit-user-select: none;\n    color: #222;\n    flex: auto;\n    overflow: hidden;\n}\n\n.blackbox-list-item.blackbox-disabled .blackbox-pattern {\n    text-decoration: line-through;\n}\n\n.blackbox-behavior {\n    flex: 0 0 100px;\n    padding-left: 10px;\n}\n\n.blackbox-behavior > select {\n    margin-left: -10px;\n}\n\n.blackbox-separator {\n    flex: 0 0 1px;\n    background-color: rgb(231, 231, 231);\n    height: 30px;\n    margin: 0 4px;\n}\n\n.blackbox-separator-invisible {\n    visibility: hidden;\n    height: 100% !important;\n}\n\n.blackbox-edit-row {\n    flex: none;\n    display: flex;\n    flex-direction: row;\n    margin: 6px 5px;\n    align-items: center;\n}\n\n.blackbox-edit-row input,\n.blackbox-edit-row select {\n    width: 100%;\n    text-align: inherit;\n}\n\n/*# sourceURL=settings/frameworkBlackboxSettingsTab.css */";Runtime.cachedResources["settings/settingsScreen.css"]="/*\n * Copyright (c) 2015 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.help-window-main {\n    color: rgb(48, 57, 66);\n    background-color: white;\n    padding: 11px 0 0 0;\n}\n\n.help-window-caption {\n    border-bottom: solid 1px rgb(153, 153, 153);\n    margin: 0 8px;\n    padding: 0 2px;\n    line-height: 28px;\n}\n\n.help-content {\n    overflow-y: auto;\n    overflow-x: hidden;\n    margin: 8px 8px 8px 0;\n    padding: 0 4px;\n    flex: auto;\n}\n\n.help-footnote {\n    border-top: 1px solid #EEEEEE;\n    margin: 0;\n    padding: 12px;\n}\n\n.help-container {\n    width: 100%;\n    -webkit-user-select: auto;\n    -webkit-column-width: 288px;\n}\n\n.help-no-columns {\n    -webkit-column-width: initial !important;\n}\n\n.help-block {\n    display: block;\n    padding-bottom: 9px;\n    width: 288px;\n    -webkit-column-break-inside: avoid;\n}\n\n.settings-tab.help-container {\n    -webkit-column-width: 308px;\n}\n\n.settings-tab .help-block {\n    margin-left: 20px;\n}\n\n.settings-tab .field-error-message {\n    color: DarkRed;\n    height: 0; /* Avoid changing element height when content is set. */\n}\n\n.help-line {\n    padding-bottom: 5px;\n    margin-bottom: 5px;\n}\n\n.help-key-cell {\n    display: inline-block;\n    width: 153px;\n    white-space: nowrap;\n    text-align: right;\n    vertical-align: middle;\n    padding-right: 6px;\n}\n\n.help-cell {\n    display: inline-block;\n    width: 135px;\n    vertical-align: middle;\n}\n\n.help-section-title {\n    font-size: 120%;\n    text-align: left;\n}\n\n.help-key {\n    padding: 0.1em 0.6em;\n    border: 1px solid #ccc;\n    font-size: 11px;\n    background-color: #f7f7f7;\n    color: #333;\n    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2), 0 0 0 2px #ffffff inset;\n    border-radius: 3px;\n    display: inline-block;\n    margin: 0 0.1em;\n    text-shadow: 0 1px 0 #fff;\n    line-height: 1.5;\n    white-space: nowrap;\n}\n\n.help-combine-keys,\n.help-key-delimiter {\n    font-size: 9px;\n}\n\n.help-combine-keys {\n    margin: 0 0.3em;\n}\n\n.help-key-delimiter {\n    margin: 0 0.5em;\n    display: none;\n}\n\nfieldset {\n    margin: 0;\n    padding: 0;\n    border: none;\n}\n\n.settings-tab label {\n    padding-right: 4px;\n    display: inline-flex;\n}\n\n#general-tab-content .help-block fieldset legend {\n    font-size: 14px;\n}\n\n.help-block p p {\n    padding-left: 30px;\n}\n\n.help-content p.help-section {\n    margin: 0 0 15px 0;\n}\n\n.settings-experiments-warning-subsection-warning {\n    color: rgb(200, 0, 0);\n}\n\n.settings-experiments-warning-subsection-message {\n    color: inherit;\n}\n\n.help-content input[type=checkbox] {\n    margin: 1px 7px 1px 2px;\n}\n\n.settings-window-title {\n    font-size: 18px;\n    color: rgb(48, 57, 66);\n    padding: 0 0 5px 13px;\n}\n\n.help-container-wrapper {\n    position: absolute;\n    top: 31px;\n    left: 0px;\n    right: 0;\n    bottom: 0;\n    overflow: auto;\n    padding-top: 9px;\n}\n\n.settings-tab.help-content {\n    margin: 0;\n    padding: 0;\n}\n\n.settings-tab input:not([type]),\n.settings-tab input[type=\"text\"] {\n    border: 1px solid rgb(213, 213, 213);\n    border-radius: 2px;\n    color: #444444;\n    padding: 3px;\n}\n\n.settings-tab input.numeric {\n    text-align: right;\n}\n\n.settings-tab-container {\n    flex: auto;\n    overflow: hidden;\n}\n\n.settings-tab-container header {\n    padding: 0 0 6px;\n    border-bottom: 1px solid #EEEEEE;\n}\n\n#experiments-tab-content .help-container {\n    -webkit-column-width: 470px;\n}\n\n#experiments-tab-content .help-block {\n    width: 470px;\n    margin-left: 0;\n}\n\n.settings-tab-container header > h3 {\n    font-size: 18px;\n    font-weight: normal;\n    margin: 0;\n    padding-bottom: 3px;\n}\n\n.settings-tab .help-section-title {\n    margin-left: -20px;\n    color: #222;\n}\n\n.settings-tab .help-block fieldset:disabled label:hover {\n    color: inherit;\n}\n\n.settings-tab .help-block label:hover {\n    color: #222;\n}\n\n.settings-tab p {\n    margin: 12px 0;\n}\n\n.settings-tab select {\n    margin-left: 10px;\n}\n\n#workspace-tab-content .settings-tab.help-content.help-container {\n    -webkit-column-width: initial;\n    overflow: hidden;\n    padding-right: 10px;\n}\n\n\n#workspace-tab-content .button:hover {\n    opacity: 1.0 !important;\n}\n\n#workspace-tab-content .help-block {\n    width: auto;\n    margin-right: 20px;\n}\n\np.folder-exclude-pattern {\n    display: flex;\n    align-items: center;\n}\n\np.folder-exclude-pattern > input {\n    flex: auto;\n}\n\n.file-system-mapping-view {\n}\n\n.settings-tab .file-system-container {\n    border-top: 1px solid #aaa;\n    padding: 19px 0 10px;\n    margin: 20px 0;\n}\n\n.settings-tab .file-system-header {\n    display: flex;\n    flex-direction: row;\n    align-items: center;\n}\n\n.settings-tab .file-system-name {\n    font-weight: bold;\n    flex: none;\n    margin-right: 10px;\n    font-size: 15px;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    max-width: 70%;\n}\n\n.settings-tab .file-system-path {\n    white-space: nowrap;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    flex: auto;\n}\n\n.settings-tab .file-system-remove {\n    flex: none;\n    margin-left: 10px;\n}\n\n.help-indent-labels label {\n    padding-left: 10px;\n}\n\n.settings-experiment-hidden {\n    display: none;\n}\n\n.settings-experiment-hidden label {\n    background-color: #ddd;\n}\n\n.settings-developer-mode .settings-experiment-hidden {\n    display: block;\n}\n\n.settings-info-message {\n    background-color: #eee;\n    padding: 10px;\n    margin: 20px 0;\n}\n/*# sourceURL=settings/settingsScreen.css */";