var DataSourceTree;
var timers = [];
var active = false;


$(document).ready(function() {
	var hash = location.hash;
	var scrollFix = 0;
	var scrollHash = hash;
	if (hash) {
		if (hash.indexOf('milestone') > 0) {
			var milestoneHash = hash;
			scrollFix = 110;
		} else if (hash.indexOf('activity') > 0) {
			if ( hash.indexOf('mobile') > 0 ) {
				var milestoneHash = '#' + $(hash).parents('.collapse').attr('id');
			} else {
				var milestoneHash = '#' + $('#admin-design').find(hash).parents('.collapse').attr('id');
			}

			scrollHash = $('#admin-design').find(hash);
			scrollFix = 70;
		} else if (hash.indexOf('story') > 0) {
			if ($(hash).hasClass('hide') || $(hash).hasClass('locked')) {
				return;
			}

			var milestoneHash = '#' + $('#admin-design').find(hash).parents('.collapse').attr('id');
			scrollHash = $('#admin-design').find(hash).parents('.activity');
			scrollFix = 70;

			var storyContainer = $('#admin-design').find(hash).addClass('selected').parents('.activity').find('.ajaxStory');
			loadContent(storyContainer, $(hash).data('id'), $(hash).data('type'), $(hash).data('sid'));
		}

		$(milestoneHash).collapse('show');

		if ($(hash).hasClass('collapse')) {
			$(hash).collapse('show');
		}
		if (!$('#mobile-project').parents('.visible-xs').is(":visible")) {
			var soff = $(scrollHash).offset();
			if (!soff) return;
			var scroll = soff.top - scrollFix;
			$('body').animate({
				scrollTop: scroll
			}, 1000);
		}
	}

	if ( $('#admin-design[role=view]').length ) {
		updateProgress($('#admin-design').data('pid'));
	}


	DataSourceTree = function(options) {
		this._data 	= options.data;
		this._url = options.url;
		this._container = options.container;
	}

	DataSourceTree.prototype.data = function(options, callback) {
		var self = this;
		var $data = null;
		if(!("name" in options) && !("type" in options)){
			if (!this._data && this._url) {
				var con = this._container;
				$.ajax(this._url, {
					type: "GET",
					dataType: "json",
					success: function (response) {
						if (response) {
							if (con) {
								$(con).removeClass("hidden");
							}
							callback({ data: response });
							return;
						} else {
							if (con) {
								$(con).addClass("hidden");
							}
						}
					}
				});
			} else {
				$data = this._data;//the root tree
				callback({ data: $data });
				return;
			}
		}
		else if("type" in options && options.type == "folder") {
			if("additionalParameters" in options && "children" in options.additionalParameters)
				$data = options.additionalParameters.children;
			else $data = {}//no data
		}
		if($data != null)//this setTimeout is only for mimicking some random delay
			setTimeout(function(){callback({ data: $data });} , parseInt(Math.random() * 500) + 200);
	};

	$('#mobile-project').on('click', '.story', function(e) {
		location.href = $(this).attr('href');
	});

	$('#admin-design').on('click', '.story', function(e) {
		if (active || $(this).hasClass('selected') || $(this).hasClass('add-story')) {
			return;
		}
		e.preventDefault();
		var id = $(this).data('id');
		$('.story.selected').removeClass('selected');
		if (id == undefined || $(this).hasClass('locked')) {
			return;
		}
	   	active = true;
	   	clearTimeout(timers['achieve']);
		timers['action'] = setTimeout(function() { active = false; }, 10000);
		$(this).addClass('selected');
	    if (!window.spinner) {
			var opts = {
			  lines: 13, // The number of lines to draw
			  length: 5, // The length of each line
			  width: 11, // The line thickness
			  radius: 30, // The radius of the inner circle
			  corners: 1, // Corner roundness (0..1)
			  rotate: 0, // The rotation offset
			  direction: 1, // 1: clockwise, -1: counterclockwise
			  color: "#999", // #rgb or #rrggbb or array of colors
			  speed: 1, // Rounds per second
			  trail: 60, // Afterglow percentage
			  shadow: false, // Whether to render a shadow
			  hwaccel: false, // Whether to use hardware acceleration
			  className: "spinner", // The CSS class to assign to the spinner
			  zIndex: 2e9, // The z-index (defaults to 2000000000)
			  top: "30px", // Top position relative to parent in px
			  left: "auto" // Left position relative to parent in px
			};
			var target = this;
			window.spinner = new Spinner(opts).spin(target);
			window.spinner.stop();
		}

		window.spinner.spin(this);

		location.hash = $(this).attr('id');

		var storyContainer = $(this).parents('.activity').find('.ajaxStory');
		if ($(storyContainer).attr('data-state') == 'open' && id == $(storyContainer).attr('data-id')) {
			closeStoryPanel(storyContainer);
			return;
		}

		loadContent(storyContainer, id, $(this).data('type'), $(this).data('sid'));
		/*
		if ($(this).attr('data-type') == 'story') {
			loadStory(storyContainer, id);
		}
		*/
	});

	$(document).on('click', '#admin-design .close-ajax-panel', function(e) {
		var storyContainer = $(this).closest('.ajaxStory');
		closeStoryPanel(storyContainer);
	});

	$(document).on('click', '#admin-design .ajaxStory .btn-ajax', function(e) {
		e.preventDefault();

		var url = $(this).attr('href');
		var storyContainer = $(this).closest('.ajaxStory');

		$.ajax({
			url: url,
			cache: false,
			type: 'GET',
			dataType: 'HTML',
			success: function (data) {
				closeStoryPanel(storyContainer);
			}
		});
	});

	$("#project-sortable").sortable({
		axis: 'y',
		update: function (event, ui) {
			$('#project-sequence-ordering').val($(this).sortable("serialize"));
		}
	});


	$(document).on('click', '.quizview', function(e) {
		e.preventDefault();
		var id = $(this).attr('data-asid');
		var activity_id = $(this).attr('data-actid');
		var astype = $(this).attr('data-astype');
		if (id > 0) {
			url = '/assess/assessments/take/' + id + '/' + activity_id;
			if (astype != 'quiz') {
				location.href = url;
				return true;
			}
			$.get(url, function(data) {
				$('#quiz-inner').html(data);
				$('#quiz .modal-dialog').addClass('modal-lg');
				$('#quiz .modal-title').html('Check your Knowledge');
			});
		} else {
			return false;
		}
	});

	$(document).on('click', '.file-tab', function(e) {
		var target = $(this).attr('href');
		var tree = $(target + ' .filebrowser').data('tree');
		var l = tree.$element[0].children.length;
		if (l < 3) {
			$(target + ' .browse-control').find('button').remove();
			$(target + ' .browse-control').html('<p>No files available</p>');
		}
	});

});

function loadStory(selector, id) {
	//find better way to handle url
	var url = '/project/projects/view_topic/';
	var url = url + '' + id;

	$.get(url, function(data) {
		$(selector).attr('data-state', 'open');
		$(selector).attr('data-id', id);
		$(selector).hide().html(data).slideDown(300);
	});
}


function loadContent(selector, id, type, sid) {
	//find better way to handle url
	timers['id'] = id;
	if (type == 'story') {
		var url = '/project/projects/view_topic/';
		var wait = 10;
	} else if (type == 'assessment') {
		var url = '/project/projects/view_assessment/';
	} else if (type == 'comm') {
		var url = '/project/projects/view_comm/';
		var wait = 10;
	}

	url += id;

	//append project id
	url += '/' + $('#timeline-project').data('id');
	//append story id
	url += '/' + sid;

	$.get(url, function(data) {
		$(selector).attr('data-state', 'open');
		$(selector).attr('data-id', id);
		$(selector).hide().html(data).slideDown(300, function() {
			if (type == 'story') {
				var container = '#outer_Story_Topic' + id;


				var datatree = new DataSourceTree({
					url: $(container).data('url'),
					container: container
				});

				$('.filebrowser_Story_Topic'+id).ace_tree({
					dataSource: datatree,
					loadingHTML:'<div class="tree-loading"><i class="ace-icon fa fa-refresh fa fa-spin blue"></i></div>',
					'open-icon' : 'ace-icon fa fa-folder-open',
					'close-icon' : 'ace-icon fa fa-folder',
					'selectable' : true,
					'selected-icon' : 'ace-icon fa fa-check',
					'unselected-icon' : 'ace-icon fa fa-check'
				});

				var tree = $('.filebrowser_Story_Topic'+id).data('tree');
				$('#browsedown').on('click', function() {
					var items = tree.selectedItems();
					window.location.href = $(container).data('download') + '/' + items[0].id;
				});
			}
       		if (window.spinner) {
       			window.spinner.stop();
	        }
	        active = false;
	        if (timers['action']) {
    	     	clearTimeout(timers['action']);
	        }
		});

		// load files
		filediv = $('#attachments_' + id);
		key = filediv.attr('data-id');
		datatree = new DataSourceTree({
			url: filediv.attr('data-url')
		});
		browsel = $('#filebrowser_' + key);
		browsel.ace_tree({
				'dataSource': datatree,
				'loadingHTML': '<div class="tree-loading"><i class="ace-icon fa fa-refresh fa fa-spin blue"></i></div>',
				'open-icon' : 'ace-icon fa fa-folder-open',
				'close-icon' : 'ace-icon fa fa-folder',
				'selectable' : true,
				'selected-icon' : 'ace-icon fa fa-check',
				'unselected-icon' : 'ace-icon fa fa-check'
		});

		var tree = browsel.data('tree');
		$('#browsedown_' + key).on('click', function() {
			var items = tree.selectedItems();
			window.location.href = $(filediv).attr('data-download') + '/' + items[0].id;
		});

		achurl = $('#achievestory' + id).attr('href');
		if ( $('#admin-design[role=view]').length && achurl && !$('#story'+sid).hasClass('completed')) {
			timers['achieve'] = setTimeout(function() {
				if (timers['id'] == id && !$('#story'+sid).hasClass('completed')) {
					$.get(achurl + ".json", function(data) {
						var pid = $('#admin-design').data('pid');
						if (pid) updateProgress(pid);

						if (data.unlocks.length > 0) {
							showAchievement(data.unlocks);
						}
					});
				}
			}, wait * 1000);

		}
	});
}

function updateProgress(id) {
	$.get('/project/projects/progress/'+id+'.json', function(data) {
		for(var mId in data.Milestone) {
			//Milestone
			var milestone = data.Milestone[mId];
			var selector = $('#milestone'+mId).parents('.panel').find('.panel-heading .meter');

			if (milestone.progress >= 60) {
				$(selector).removeClass('red orange green').addClass('green');
			} else if (milestone.progress > 30) {
				$(selector).removeClass('red orange green').addClass('orange');
			}

			$(selector).find('span').animate({
				width: milestone.progress + '%'
			}, 1200);

			//mobile-milestone
			var mobileSelector = $('#mobile-milestone'+mId).parents('.panel').find('span[role=progress]');
			$(mobileSelector).text('Progress: ' + milestone.progress + '%');

			//Activity
			for(var aId in milestone.Activity) {
				var activity = milestone.Activity[aId];

				for (sId in activity.ActivitySequence) {
					if (activity.ActivitySequence[sId].completed && !$('#story'+sId).hasClass('completed')) {
						$('.story[data-sid='+sId+']').addClass('completed');
					}

					if (activity.ActivitySequence[sId].unlock != undefined) {
						if (activity.ActivitySequence[sId].unlock) {
							$('.story[data-sid='+sId+']').removeClass('locked');
						} else {
							$('.story[data-sid='+sId+']').addClass('locked');
						}
					}

					if (activity.ActivitySequence[sId].reveal != undefined) {
						if (activity.ActivitySequence[sId].reveal) {
							$('.story[data-sid='+sId+']').removeClass('hide');
						} else {
							$('.story[data-sid='+sId+']').addClass('hide');
						}
					}
				}
			}
		}
	}, 'json');
}


function closeStoryPanel(selector) {
	$(selector).attr('data-state', 'close');
	$(selector).slideUp(300).html('');
}
