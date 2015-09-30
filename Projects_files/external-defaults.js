$(document).ready(function() {
	$("html.ie9, html.ie8, html.ie7, html.ie6").each( function() {

		if (window.location.pathname != '/pages/oldbrowser') {
			console.log("You are using an old version of IE that is unsupported by the assignment submission system. Please upgrade to IE 10 or download Chrome or Firefox to continue.");
			alert("You are using an old version of IE that is unsupported by the assignment submission system. Please upgrade to IE 10 or download Chrome or Firefox to continue.");
		}

		//window.location.replace("/");
	});

	$('.dialogs').slimScroll({
		height: '300px'
	});

	$('.select2').select2({minimumResultsForSearch: 10});

	$('[data-rel=tooltip]').tooltip();
	$('.slim-scroll').each(function () {
		var $this = $(this);
		$this.slimScroll({
			height: $this.data('height') || 100,
			railVisible:true
		});
	});

	$(".external-modal").on('click', function(e) {
		e.preventDefault();
		url = $(this).attr('href');
		title = $(this).attr('title');
		$.get(url, function(data) {
			bootbox.dialog({
				title: title,
				message: data,
				buttons: {
					'success' : {
						'label' : 'OK',
						'className' : 'btn-sm btn-primary',
					}
				}
			});
		});
		return false;
	});
});
