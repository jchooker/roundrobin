$(document).ready(function () {
    //console.log($('div[class*="toggle-btn"]').length);
    //network location: \\adhspace\ITSShare\donotdel-localapps\roundrobin
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/listhub")
        .build();

    let lastSelectedIndex = parseInt($('.container-fluid').data('last-selected-index'));
    const total = $(".col-6").length;

    //connection.start().then(() => { //reactivate for signalr?
    //    connection.invoke("UpdateLastSelectedIndex", ButtonStateStore.LastSelectedIndex);
    //}).catch(function (err) {
    //    return console.error(err.toString());
    //});

    connection.on("ReceiveSelection", function (index) {
        updateBtns(index);
    });

    function updateBtns(index) {
        //const $allCols = $(".col-4");
        const $curr = $('[data-index="' + index + '"]');
        const $currChild = $('[data-parent-index="' + index + '"]');
        const $next = $('[data-index="' + ((index + 1) % total) + '"]');
        const $nextChild = $('[data-parent-index="' + ((index + 1) % total) + '"]');

        //$allCols.removeClass("btn-success btn-danger btn-success-in-1 btn-success-out-1 btn-danger-out-1")
        //    .addClass("slide-in-success slide-out-success slide-out-danger disabled") //custom class resets
        btnDefaults();
        $next.addClass('btn-success-in-1').removeClass('disabled');
        $curr.addClass('btn-success-out-1');
        setTimeout(() => {
            $curr.removeClass('btn-success-out-1 btn-success text-warning border-warning')
                .addClass('btn-danger border-secondary text-light');
            $next.removeClass('btn-success-in-1 border-secondary text-secondary')
                .addClass('btn-success text-warning border-warning')
                .prop("aria-disabled", "false");
        }, 500);
    }

    function overrideOrder(index) {
        const $curr = $('[data-index="' + index + '"]');
    }

    function btnDefaults() {
        const $allCols = $(".col-6");
        $allCols.removeClass("btn-success btn-danger btn-success-in-1 btn-success-out-1 btn-danger-out-1 text-light")
            .addClass("disabled")
            .prop("aria-disabled", "true");        //custom class resets
    }

    $(".col-6").on("click", function (event) {
        const index = $(this).data("index");
        if (!$(this).hasClass("disabled")) {
            lastSelectedIndex = index % total;
            updateBtns(lastSelectedIndex);

            connection.invoke("UpdateLastSelectedIndex", lastSelectedIndex).catch(function (err) {
                console.error(err.toString());
            });

            //update data attrib
            $('.container-fluid').data('last-selected-index', (lastSelectedIndex + 1) % total);
        }
        event.preventDefault();
    });

    //toggle availability button
    $('.btn-row-group div[class*="toggle-btn"]').on("click", function (event) {
        event.preventDefault(); //<--remove if unnecessary
        var imgChild = $(this).find('img');

        if (imgChild.hasClass('black-to-green')) imgChild.removeClass('black-to-green').addClass('black-to-red');
        else imgChild.removeClass('black-to-red').addClass('black-to-green');

        var $thisBtn = $(this)
        var techId = $thisBtn.data("id");

        //updateAvailableTechsCount();

        $.post("/Techs/ToggleAvailability", { techId: techId })
            .done(function (response) {
                if (response.success) {
                    /*$thisBtn.text(response.isAvailable ? "Deactivate" : "Activate");*/ //<--some version of this?
                    updateAvailableTechsCount();
                }
            })
            .fail(function (jqXHR) {
                alert("Error toggling Availability. Please try again.");
            });
    });

    function updateAvailableTechsCount() {
        $.get("/Techs/GetAvailableTechsCount")
            .done(function (response) {
                if (response.availableCount !== undefined) {
                    //utilize the # available
                    console.log(response.availableCount);
                }
            })
            .fail(function () {
                alert("Error fetching number of available techs.");
            });
    }
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