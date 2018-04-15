$(document).ready(function(){
    $("input[type='text']").on('keyup', function () {
        var val1 = $.trim($('input.tabname').val()).length;
        var val2 = $.trim($('input.name').val()).length;
        if (val1 > 0 && val2 > 0) {
            $('input.btn').removeClass( "disabled" );
        }else{
            $('input.btn').addClass( "disabled" );
        }
    });
});


// jQuery smooth scroll
$(document).ready(function() {
	$('a[rel="relativeanchor"]').click(function(){
	    $('html, body').animate({
	        scrollTop: $( $.attr(this, 'href') ).offset().top - 270
	    }, 500);
	    return false;
	}); 
});