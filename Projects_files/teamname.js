$(document).ready(function() { 
    var content = $('#teamname');
    var tform = $('#TeamIndexForm');

    tform.on('click', '#teamsubmit', function (event) {
        event.preventDefault();
        $.ajax( {
            type: 'POST',
            dataType:'html',
            data: tform.serialize(),
            success:function (data, textStatus) {
                content.html(data);
                $('#edit_team').dialog('close');
            }, 
            url: tform.attr('action'),
        }); 
    }); 
});

