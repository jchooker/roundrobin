$(document).ready(function () {
    let lastSelectedIndex = parseInt($('.container-fluid').data('last-selected-index'));
    const total = $(".col-4").length;

    function updateBtns(index) {
        //const $allCols = $(".col-4");
        const $curr = $('[data-index="' + index + '"]');
        const $next = $('[data-index="' + ((index + 1) % total) + '"]');

        //$allCols.removeClass("btn-success btn-danger btn-success-in-1 btn-success-out-1 btn-danger-out-1")
        //    .addClass("slide-in-success-1 slide-out-success-1 slide-out-danger-1 disabled") //custom class resets
        btnDefaults();
        $next.addClass('btn-success-in-1');
        $curr.addClass('btn-success-out-1');
        setTimeout(() => {
            $curr.removeClass('btn-success-out-1 btn-success text-warning').addClass('btn-danger border-secondary');
            $next.removeClass('btn-success-in-1 border-dark').addClass('btn-success text-warning border-warning');
        }, 1000);
    }

    function btnDefaults() {
        const $allCols = $(".col-4");
        $allCols.removeClass("btn-success btn-danger btn-success-in-1 btn-success-out-1 btn-danger-out-1")
            .addClass("slide-in-success-1 slide-out-success-1 slide-out-danger-1 disabled") //custom class resets
    }

    $(".col-4").on("click", function (event) {
        const index = $(this).data("index");
        if (!$(this).hasClass("disabled")) {
            lastSelectedIndex = (index + 1) % total;
            updateBtns(lastSelectedIndex);

            //update data attrib
            $('.container-fluid').data('last-selected-index', lastSelectedIndex);
        }
        event.preventDefault();
    })
});
//enable all of this w/ signalr implementation
    //const connection = new signalR.HubConnectionBuilder()
    //.withUrl("/listhub")
    //.build();

    //connection.on("ReceiveSelection", function (index) {
    //    const $allCols = $(".col-4");
    //    const $current = $('[data-index="' + index + '"]');
    //    const $next = $current.next('.row').find('.col-4');

    //    $allCols.removeClass("btn-warning slide-in-success").addClass("slide-in").prop("aria-disabled", true);
    //    $("#messagesList").append(msg);
    //    });

    //    connection.start().catch(function (err) {
    //        console.error(err.toString());
    //    });
//***NOT THIS STUFF THOUGH - BEGIN*/
//$('[data-index="3"]').on("click", function (event) {
//    alert("btn click");
            //const user = $("#userInput").val();
            //const message = $("#messageInput").val();
            //connection.invoke("SendMessage", user, message).catch(function (err) {
            //    console.error(err.toString());
            //    });
            //event.preventDefault();
/*        });*/
//NOT THIS STUFF THOUGH - END
//$(".col-4").on("click", function (event) {
//    let index = $(this).data("index");
//    const total = $(".col-4").length;

//    //cycle to next idx, reset to 0 when needed
//    index = (index + 1) % total;
//});