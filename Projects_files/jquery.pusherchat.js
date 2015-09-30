/*
 * Pusher chat
 * facebook like chat jQuery plugin using Pusher API
 * version: 1.0
 * Author & support : zied.hosni.mail@gmail.com
 * © 2012 html5-ninja.com
 * for more info please visit http://html5-ninja.com
 *
*/

(function($) {

	$.fn.pusherChat = function(options) {
		//options
		var settings = $.extend({
			'pusherKey': null, // required : open an account on http://pusher.com/ to get one
			'authPath': null, // required : path to authentication scripts more info at http://pusher.com/docs/authenticating_users
			'historyPath': null, // required : path to authentication scripts more info at http://pusher.com/docs/authenticating_users
			'friendsList': null, // required : path to friends list json
			'serverPath': null, // required : path to server
			'profilePage': false, // link to friend profile page setup fom json  ex : ["Kurt Cobain","assets/cobain.jpg","path/to/profile"]
			'onFriendConnect': undefined, // event : trigger whene friend connect & return his ID
			'onFriendLogOut': undefined, // event : trigger whene friend log out & return his ID
			'onSubscription': undefined, // return  members object
			'debug': false // enable the pusher debug mode  - don't use this in production
		}, options);

		if (settings.debug) {
			Pusher.log = function(message) {
				if (window.console && window.console.log) window.console.log(message);
			};
			WEB_SOCKET_DEBUG = true;
		}

		// int var
		var pageTitle = $('title').html(); // just to update page title whene message is triggered

		// Authenticating users
		Pusher.channel_auth_endpoint = settings.authPath;
		// create pusher object
		var pusher = new Pusher(settings.pusherKey);
		// Accessing channels
		var presenceChannel = pusher.subscribe(settings.channel);

		//safe interval, if user returns within this period, user won't be shown as offline
		var safeInterval = 60 * 1000; // 60 seconds

		//object to store member id to check their return state
		var returnState = {};

		// subscription succeeded
		presenceChannel.bind('pusher:subscription_succeeded', function() {
			memberUpdate();
		});

		// trigger friend connection
		presenceChannel.bind('pusher:member_added', function() {
			//if user return within safeInterval period, clear the timeout
			if (returnState[presenceChannel.members.me.id]) {
				clearTimeout(returnState[presenceChannel.members.me.id]);
			}
			memberUpdate();
		});

		// trigger friend logout
		presenceChannel.bind('pusher:member_removed', function() {
			//set timeout to check whether this user will connects back within specified safeInterval time
			returnState[presenceChannel.members.me.id] = setTimeout(function() {
				memberUpdate();
			}, safeInterval);
		});

		if (settings.onSubscription !== undefined) {
			presenceChannel.bind('pusher:subscription_succeeded', function(members) {
				settings.onSubscription(members);
			});
		}

		if (settings.onFriendConnect !== undefined) {
			presenceChannel.bind('pusher:member_added', function(member) {
				settings.onFriendConnect(member);
			});
		}

		if (settings.onFriendLogOut !== undefined) {
			presenceChannel.bind('pusher:member_removed', function(member) {
				settings.onFriendLogOut(member);
			});
		}

		/*-----------------------------------------------------------*
		 * Bind the 'send-event' & update the chat box message log
		 *-----------------------------------------------------------*/
		presenceChannel.bind('send-event', function(data) {
			var stamp = moment().tz(window.timezone);
			if ((presenceChannel.members.me.id == data.to || 'team' == data.to) && data.from != presenceChannel.members.me.id) {
				var obj;
				if (data.to == "team") {
					if (window.suppressteamchat) {
						return false;
					}
					obj = $('a[href=#team]');
				} else {
					obj = $('a[href=#' + data.from + ']');
				}

				if ($(obj).attr('href') == undefined) {
					return false;
				}

				if (obj) {
					createChatBox(obj);
				}
				// get this from the friendlist instead...
				var name = $("a[href='#" + data.from + "'] > span.userName").html();
				if (!name) name = $("#member_" + data.from).html();
				if (!name) name = "Mystery Guest...";
				if (data.to == "team") {
					$('#id_team .msgTxt').append('<p class="friend"><b>' + name + '</b><span class="timestamp pull-right">' + stamp.format('h:mm a') + '</span><br/>' + data.message + '</p>');
					startTimer('#id_team', 'receive', 8);
					stopTimer('#id_team', 'writing');
					$('#id_team .logMsg').scrollTop($('#id_team .logMsg')[0].scrollHeight);
				} else {
					$('#id_' + data.from + ' .msgTxt').append('<p class="friend"><b>' + name + '</b><span class="timestamp pull-right">' + stamp.format('h:mm a') + '</span><br/>' + data.message + '</p>');
					startTimer('#id_' + data.from, 'receive', 8);
					stopTimer('#id_' + data.from, 'writing');
					$('#id_' + data.from + ' .logMsg').scrollTop($('#id_' + data.from + ' .logMsg')[0].scrollHeight);
				}
				if ($('title').text().search('New message - ') == -1)
					$('title').prepend('New message - ');
			}
			if (presenceChannel.members.me.id == data.from) {
				if (window.suppressteamchat && ('team' == data.to)) {
					return false;
				}
				$('#id_' + data.to + ' .msgTxt').append('<p class="you"><b>You</b><span class="timestamp pull-right">' + stamp.format('h:mm a') + '</span><br/>' + data.message + '</p>');
				$('#id_' + data.to + ' .logMsg').scrollTop($('#id_' + data.to + ' .logMsg')[0].scrollHeight);
			}
		});


		/*-----------------------------------------------------------*
		 * detect when a friend is typing a message
		 *-----------------------------------------------------------*/
		var timers = {};

		function startTimer(ele, cls, count) {
			$(ele).addClass(cls);
			var counter = 1;
			timers[ele + cls] = setInterval(function() {
				counter++;
				if (counter == count) {
					stopTimer(ele, cls);
				}
			}, 1000);
		}

		function stopTimer(ele, cls) {
			$(ele).removeClass(cls);
			clearInterval(timers[ele + cls]);
		}

		presenceChannel.bind('typing-event', function(data) {
			if ((presenceChannel.members.me.id == data.to || 'team' == data.to) && data.from != presenceChannel.members.me.id && data.message == 'true') {
				if (data.to == "team") {
					startTimer('#id_team', 'writing', 8);
				} else {
					startTimer('#id_' + data.from, 'writing', 8);
				}
			} else if ((presenceChannel.members.me.id == data.to || 'team' == data.to) && data.from != presenceChannel.members.me.id && data.message == 'null') {
				if (data.to == "team") {
					stopTimer('#id_team', 'writing');
				} else {
					stopTimer('#id_' + data.from, 'writing');
				}
			}
		});

		// trigger whene user stop typing
		$(document).on('focusout', '.pusherChatBox', function() {
			if ($(this).next().next().next().val() == 'true') {
				var from = $(this).parents('form');
				$(this).next().next().next().val('null');
				$.post(settings.serverPath, from.serialize());
			}
		});


		/*-----------------------------------------------------------*
		 * slide up & down friends list & chat boxes
		 *-----------------------------------------------------------*/
		$(document).on('click', '#pusherChat #expand,.pusherChatBox .expand', function() {
			var obj = $(this);
			obj.parent().find('.scroll,.slider').slideToggle('1', function() {
				if ($(this).is(':visible')) {
					obj.find('.close').show();
					obj.find('.open').hide();
				} else {
					obj.find('.close').hide();
					obj.find('.open').show();
				}
			});
			return false;
		});

		// close chat box
		$(document).on('click', '#pusherChat .closeBox', function() {
			$(this).parents('.pusherChatBox').hide();
			updateBoxPosition();
			return false;
		});

		// trigger click on friend & create chat box
		$(document).on('click', '#pusherChat #members-list a', function() {
			var obj = $(this);
			createChatBox(obj);
			return false;
		});

		// some action whene click on chat box
		$(document).on('click', '.pusherChatBox', function() {
			var newMessage = false;
			$(this).removeClass('receive');
			$('.pusherChatBox').each(function() {
				if ($(this).hasClass('receive')) {
					newMessage = true;
					return false;
				}
			});
			if (newMessage == false)
				$('title').text(pageTitle);
		});

		/*-----------------------------------------------------------*
		 * memberUpdate() place & update friends list on client page
		 *-----------------------------------------------------------*/
		function memberUpdate() {
			$.getJSON(settings.friendsList, function(data) {
				var c = 0;
				var s = '';

				var offlineUser = onlineUser = invisibleUser = '';
				var chatBoxOnline;
				$.each(data, function(user_id, val) {
					if (user_id != presenceChannel.members.me.id) {
						user = presenceChannel.members.get(user_id);
						if (val[3] == 'invisible') {
							invisibleUser += '<a href="#' + user_id + '" class="hide off"><img src="' + val[1] + '"/> <span class="userName">' + val[0] + '</span></a>';
							chatBoxOnline = 'off';
						} else if (user || user_id == "team") {
							onlineUser += '<a href="#' + user_id + '" class="on"><img src="' + val[1] + '"/> <span id="member_' + user_id + '" class="userName">' + val[0] + '</span></a>';
							chatBoxOnline = 'on';

							if (user_id != 'team') c++;
						} else {
							offlineUser += '<a href="#' + user_id + '" class="off"><img src="' + val[1] + '"/> <span class="userName">' + val[0] + '</span></a>';
							chatBoxOnline = 'off';
						}
					}
					$('#id_' + user_id).removeClass('off').removeClass('on').addClass(chatBoxOnline);
				});
				$('#pusherChat #members-list').html(onlineUser + offlineUser + invisibleUser);

				if (c == 0) {
					c = 'no';
					s = 's';
				}
				if (c > 1) {
					s = 's';
				}
				$("#count").html(c + ' team member' + s);
			});

		}

		/*-----------------------------------------------------------*
		 * create a chat box from the html template
		 *-----------------------------------------------------------*/
		function createChatBox(obj) {
			var name = obj.find('span').html();
			var img = obj.find('img').attr('src');
			var id = obj.attr('href').replace('#', 'id_');
			var off = clone = '';
			if (obj.hasClass('off')) off = 'off';

			if (!$('#' + id).html()) {
				$('#templateChatBox .pusherChatBox h2 .userName').html(name);
				$('#templateChatBox .pusherChatBox h2 img').attr('src', img);
				$('.chatBoxslide').prepend($('#templateChatBox .pusherChatBox').clone().attr('id', id));
				loadChatHistory(obj.attr('href').replace('#', ''));
			} else if (!$('#' + id).is(':visible')) {
				clone = $('#' + id).clone();
				$('#' + id).remove();
				if (!$('.chatBoxslide .pusherChatBox:visible:first').html())
					$('.chatBoxslide').prepend(clone.show());
				else
					$(clone.show()).insertBefore('.chatBoxslide .pusherChatBox:visible:first');
			}
			if (settings.profilePage) {
				$.getJSON(settings.friendsList, function(data) {
					var profileUrl = data[obj.attr('href').replace('#', '')][2];
					$('#' + id + ' h2 a').attr('href', profileUrl);
				});
			}
			//$('#'+id+' textarea').focus();
			$('#' + id + ' .from').val(presenceChannel.members.me.id);
			$('#' + id + ' .to').val(obj.attr('href'));
			$('#' + id).addClass(off);
			updateBoxPosition();
			return false;
		}

		function loadChatHistory(id) {
				url = settings.historyPath + '/' + id + '.json';
				$.getJSON(url, function(data) {
					window.timezone = data.timezone;
					var day = moment.utc().tz(window.timezone).format('MMM D');
					var dateline = '';
					$.each(data, function(ind, val) {
						if (!val.TeamChatLog) {
							return true;
						}
						var stamp = moment.utc(val.TeamChatLog.created).tz(window.timezone);
						if (day != stamp.format('MMM D')) {
							dateline = '<span class="dateline">' + day + '</span>';
							day = stamp.format('MMM D');
						}
						if (presenceChannel.members.me.id == val.TeamChatLog.from_uuid) {
							$('#id_' + id + ' .msgTxt').prepend('<p class="you"><b>You</b><span class="timestamp pull-right">' + stamp.format('h:mm a') + '</span><br/>' + val.TeamChatLog.message + '</p>' + dateline);
							$('#id_' + id + ' .logMsg').scrollTop($('#id_' + id + ' .logMsg')[0].scrollHeight);
						} else {
							var name = $("a[href='#" + val.TeamChatLog.from_uuid + "'] > span.userName").html();
							if (!name) name = $("#member_" + val.TeamChatLog.from_uuid).html();
							if (!name) name = "Mystery Guest...";
							$('#id_' + id + ' .msgTxt').prepend('<p class="friend"><b>' + name + '</b><span class="timestamp pull-right">' + stamp.format('h:mm a') + '</span><br/>' + val.TeamChatLog.message + '</p>' + dateline);
							$('#id_' + id + ' .logMsg').scrollTop($('#id_' + id + ' .logMsg')[0].scrollHeight);
						}
						dateline ='';
					});
					// put date at top
					$('#id_' + id + ' .msgTxt').prepend('<span class="dateline">' + day + '</span>');
				});
			}
			/*-----------------------------------------------------------*
			 * reorganize the chat box position on adding or removing
			 *-----------------------------------------------------------*/
		function updateBoxPosition() {
			var right = 0;
			var slideLeft = false;
			$('.chatBoxslide .pusherChatBox:visible').each(function() {
				$(this).css({
					'right': right
				});

				right += $(this).width() + 20;

				$('.chatBoxslide').css({
					'width': right
				});

				if ($(this).offset().left - 20 < 0) {
					$(this).addClass('overFlow');
					slideLeft = true;
				} else
					$(this).removeClass('overFlow');


			});
			if (slideLeft) $('#slideLeft').show();
			else $('#slideLeft').hide();

			if ($('.overFlowHide').html()) $('#slideRight').show();
			else $('#slideRight').hide();
		}


		$(document).on('click', '#slideLeft', function() {
			$('.chatBoxslide .pusherChatBox:visible:first').addClass('overFlowHide');
			$('.chatBoxslide .pusherChatBox.overFlow').removeClass('overFlow');
			updateBoxPosition();
		});

		$(document).on('click', '#slideRight', function() {
			$('.chatBoxslide .pusherChatBox.overFlowHide:last').removeClass('overFlowHide');
			updateBoxPosition();
		});

		/*-----------------------------------------------------------*
		 * send message & typing event to server
		 *-----------------------------------------------------------*/
		$(document).on('keypress', "#pusherChat .pusherChatBox textarea", function(event) {
			var from = $(this).parents('form');
			var msg = $(this).val().trim();
			if (event.which == 13 && msg.length) {
				$(this).next().next().next().val('false');
				$.post(settings.serverPath, from.serialize());
				event.preventDefault();
				$(this).val('');
				$(this).focus();
			} else {
				// call the timer
				if (msg.length) {
					sendTyping(this, from, 8);
				}
			}
		});

		var is_sent = false;

		function sendTyping(ele, from, count) {
			if (is_sent) return;
			$(ele).next().next().next().val('true');
			$.post(settings.serverPath, from.serialize());
			is_sent = true;
			var counter = 1;
			timers[ele] = setInterval(function() {
				counter++;
				if (counter == count) {
					is_sent = false;
					$(ele).next().next().next().val('false');
					clearInterval(timers[ele]);
				}
			}, 1000);
		}

		/*-----------------------------------------------------------*
		 * some css tricks
		 *-----------------------------------------------------------*/
		$('#pusherChat .scroll').css({
			'max-height': $(window).height() - 50
		});

		$('#pusherChat .chatBoxWrap').css({
			'width': $(window).width() - $('#membersContent').width() - 30
		});

		$(window).resize(function() {
			$('#pusherChat .scroll').css({
				'max-height': $(window).height() - 50
			});

			$('#pusherChat .chatBoxWrap').css({
				'width': $(window).width() - $('#membersContent').width() - 30
			});
			updateBoxPosition();
		});

	};


})(jQuery);
