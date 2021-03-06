var View = require('./View');
var popup = require('../popup');

var inputChangedTimeout;

class SettingsView extends View {
	
	constructor(className, models, settings){
		super(className, models, settings);
		//this.$elements.filter('input').on('change', (e) => this.selectChanged($(e.currentTarget), e));
		this.settings.on('change', (data) => this._IDESettings(data) );
		this.$elements.filterByData = function(prop, val) {
			return this.filter(
				function() { return $(this).data(prop)==val; }
			);
		}
		
		$('#runOnBoot').on('change', () => {
			if ($('#runOnBoot').val() && $('#runOnBoot').val() !== '--select--')
				this.emit('run-on-boot', $('#runOnBoot').val());
		});
		
		this.inputJustChanged = false;
		
	}
	
	selectChanged($element, e){
		var data = $element.data();
		var func = data.func;
		var key = data.key;
		if (func && this[func]){
			this[func](func, key, $element.val());
		}
	}
	buttonClicked($element, e){
		var func = $element.data().func;
		if (func && this[func]){
			this[func](func);
		}
	}
	inputChanged($element, e){
		var data = $element.data();
		var func = data.func;
		var key = data.key;
		var type = $element.prop('type');
		
		if (inputChangedTimeout) clearTimeout(inputChangedTimeout);
		inputChangedTimeout = setTimeout( () => this.inputJustChanged = false, 100);
		this.inputJustChanged = true;
		
		if (type === 'number' || type === 'text'){
			if (func && this[func]){
				this[func](func, key, $element.val());
			}
		} else if (type === 'checkbox'){
			if (func && this[func]){
				this[func](func, key, $element.is(':checked') ? 1 : 0);
			}
		}
	}
	
	setCLArg(func, key, value){
		this.emit('project-settings', {func, key, value});
	}
	restoreDefaultCLArgs(func){
		
		// build the popup content
		popup.title('Restoring default project settings');
		popup.subtitle('Are you sure you wish to continue? Your current project settings will be lost!');
		
		var form = [];
		form.push('<button type="submit" class="button popup-continue">Continue</button>');
		form.push('<button type="button" class="button popup-cancel">Cancel</button>');
		
		popup.form.append(form.join('')).off('submit').on('submit', e => {
			e.preventDefault();
			this.emit('project-settings', {func});
			popup.hide();
		});
		
		popup.find('.popup-cancel').on('click', popup.hide );
		
		popup.show();
		
		popup.find('.popup-continue').trigger('focus');

	}
	
	setIDESetting(func, key, value){
	console.log(func, key, value);
		this.emit('IDE-settings', {func, key, value: value});
	}
	restoreDefaultIDESettings(func){
		
		// build the popup content
		popup.title('Restoring default IDE settings');
		popup.subtitle('Are you sure you wish to continue? Your current IDE settings will be lost!');
		
		var form = [];
		form.push('<button type="submit" class="button popup-continue">Continue</button>');
		form.push('<button type="button" class="button popup-cancel">Cancel</button>');
		
		popup.form.append(form.join('')).off('submit').on('submit', e => {
			e.preventDefault();
			this.emit('IDE-settings', {func});
			popup.hide();
		});
		
		popup.find('.popup-cancel').on('click', popup.hide );
		
		popup.show();
		
		popup.find('.popup-continue').trigger('focus');
		
	}
	
	shutdownBBB(){
	
		// build the popup content
		popup.title('Shutting down Bela');
		popup.subtitle('Are you sure you wish to continue? The BeagleBone will shutdown gracefully, and the IDE will disconnect.');
		
		var form = [];
		form.push('<button type="submit" class="button popup-continue">Continue</button>');
		form.push('<button type="button" class="button popup-cancel">Cancel</button>');
		
		popup.form.append(form.join('')).off('submit').on('submit', e => {
			e.preventDefault();
			this.emit('halt');
			popup.hide();
		});
		
		popup.find('.popup-cancel').on('click', popup.hide );
		
		popup.show();
		
		popup.find('.popup-continue').trigger('focus');
	
	}
	aboutPopup(){
		
		// build the popup content
		popup.title('About Bela');
		popup.subtitle('You are using Bela Version 0.1, July 2016. Bela is an open source project licensed under GPL, and is a product of the Augmented Instruments Laboratory at Queen Mary University of London. For more information, visit http://bela.io');
		var form = [];
		form.push('<button type="submit" class="button popup-continue">Close</button>');
		
		popup.form.append(form.join('')).off('submit').on('submit', e => {
			e.preventDefault();
			popup.hide();
		});
				
		popup.show();
		
		popup.find('.popup-continue').trigger('focus');
		
	}
	updateBela(){
	
		// build the popup content
		popup.title('Updating Bela');
		popup.subtitle('Please select the update zip archive');
		
		var form = [];
		form.push('<input id="popup-update-file" type="file">');
		form.push('</br>');
		form.push('<button type="submit" class="button popup-upload">Upload</button>');
		form.push('<button type="button" class="button popup-cancel">Cancel</button>');

		/*popup.form.prop({
			action	: 'updates',
			method	: 'get',
			enctype	: 'multipart/form-data'
		});*/
		
		popup.form.append(form.join('')).off('submit').on('submit', e => {
		
			//console.log('submitted', e);
			
			e.preventDefault();
			
			var file = popup.find('input[type=file]').prop('files')[0];
			
			//console.log('input', popup.find('input[type=file]'));
			//console.log('file', file);
			
			if (file){
			
				this.emit('warning', 'Beginning the update - this may take several minutes');
				this.emit('warning', 'The browser may become unresponsive and will temporarily disconnect');
				this.emit('warning', 'Do not use the IDE during the update process!');
				
				var reader = new FileReader();
				reader.onload = (ev) => this.emit('upload-update', {name: file.name, file: ev.target.result} );
				reader.readAsArrayBuffer(file);
				
			} else {
			
				this.emit('warning', 'not a valid update zip archive');
				
			}
			
			popup.hide();
			popup.overlay();
			
		});
		
		popup.find('.popup-cancel').on('click', popup.hide );
				
		popup.show();
		
	}
	
	// model events
	_CLArgs(data){
		var args = '';
		for (let key in data) {
		
			let el = this.$elements.filterByData('key', key);
			
			// set the input value when neccesary
			if (el[0].type === 'checkbox') {
				el.prop('checked', (data[key] == 1));
			} else if (key === '-C' || (el.val() !== data[key] && !this.inputJustChanged)){
				//console.log(el.val(), data[key]);
				el.val(data[key]);
			}

			// fill in the full string
			if (key[0] === '-' && key[1] === '-'){
				args += key+'='+data[key]+' ';
			} else if (key === 'user'){
				args += data[key];
			} else if (key !== 'make'){
				args += key+data[key]+' ';
			}
		}

		$('#C_L_ARGS').val(args);
	}
	_IDESettings(data){
		for (let key in data){
			this.$elements.filterByData('key', key).val(data[key]).prop('checked', data[key]);
		}
	}
	_breakpoints(value, keys){
		this.emit('project-settings', {func: 'setBreakpoints', value});
	}
	_projectList(projects, data){

		var $projects = $('#runOnBoot');
		$projects.empty();
		
		// add an empty option to menu and select it
		$('<option></option>').html('--select--').appendTo($projects);
		
		// add a 'none' option
		$('<option></option>').attr('value', 'none').html('none').appendTo($projects);

		// fill project menu with projects
		for (let i=0; i<projects.length; i++){
			if (projects[i] && projects[i] !== 'undefined' && projects[i] !== 'exampleTempProject' && projects[i][0] !== '.'){
				$('<option></option>').attr('value', projects[i]).html(projects[i]).appendTo($projects);
			}
		}

		
	}
}

module.exports = SettingsView;