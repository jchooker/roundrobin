$(document).ready(function () { //on page load
    //console.log($('div[class*="toggle-btn"]').length);
    //network location: \\adhspace\ITSShare\donotdel-localapps\roundrobin
    const toggleButtons = $('div[class*="toggle-btn"]');
    const techButtons = $('div[class*="tech-queue-btn"]')
    const overrideButtons = $('div[class*="override-btn"]')
    const queueIdToIdMap = {};
    const idToQueueIdMap = {};

    toggleButtons.each(function () {
        const id = $(this).data('id');
        const queueId = $(this).data('queue-id');
        idToQueueIdMap[id] = queueId;
        queueIdToIdMap[queueId] = id;
    });

    function findNextActiveIndex(currentIndex) {
        const totalButtons = techButtons.length;
        let nextIndex = (currentIndex + 1) % totalButtons;

        while ($(techButtons[nextIndex]).attr('aria-disabled')) {
            nextIndex = (nextIndex + 1) % totalButtons;
            if (nextIndex == currentIndex) {
                //to stop loop
                break;
            }
        }

        return nextIndex;
    }

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

    async function initLoad(index) {
        const activeTechs = await getAvailableTechsCount();
    }

    async function updateBtns(index) {
        try {

            //const $allCols = $(".col-4");
            const activeTechs = await getAvailableTechsCount()
            var minActiveTechs = activeTechs <= 1;
            const allTechs = await getAllTechsCount(); 
            let currTechs;
            let $curr, $currChild, $next, $nextChild;
            console.log("activeTechs amt: " + activeTechs);
            switch (activeTechs) {
                case allTechs:
                    currTechs = allTechsAvailable(index);
                    $curr = currTechs[0];
                    $currChild = currTechs[1];
                    $next = currTechs[2];
                    $nextChild = currTechs[3];
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
                    break;
                case 2:
                    currTechs = allTechsAvailable(index);
                    $curr = currTechs[0];
                    $currChild = currTechs[1];
                    $next = currTechs[2];
                    $nextChild = currTechs[3];
                    btnDefaults();
                case 1:
                    console.log("SCENARIO COUNT 1 CURRCHILD:" + $currChild);
                    currTechs = oneTechAvailable(index);
                    $curr = currTechs[0];
                    $currChild = currTechs[1];
                    btnDefaults();
                    //$curr.addClass('btn-success-in-1');
                    $curr.addClass('btn-success-out-false').removeClass("slide-out-success ");
                    //                setTimeout(() => {
                    //                    console.log("FIRST TIMEOUT");
                    //                    $curr.removeClass('btn-success-out-false btn-success text-warning border-warning')
                    //                        .addClass('border-secondary text-secondary');
                    //                    //$next.removeClass('btn-success-in-1 border-secondary text-secondary')
                    //                    //    .addClass('btn-success text-warning border-warning')
                    //                    //    .prop("aria-disabled", "false");
                    //                }, 500);
                    console.log("Before first timeout: " + $curr.attr("class"));
                    applyFirstTimeoutCase1($curr).then(function () {
                        $curr.addClass('btn-success-in-1');
                        console.log("Before second timeout: " + $curr.attr("class"));
                        applySecondTimeoutCase2($curr);
                    });
                    //                setTimeout(() => {
                    //                    console.log("SECOND TIMEOUT");
                    //                    $curr.removeClass('btn-success-in-1 text-secondary border-secondary disabled')
                    //                        .addClass('border-warning text-warning btn-success btn-success');
                    //                    //$next.removeClass('btn-success-in-1 border-secondary text-secondary')
                    //                    //    .addClass('btn-success text-warning border-warning')
                    //                    //    .prop("aria-disabled", "false");
                    //                }, 1000);
                default:
                    break;
            }
        }
        catch (err) {
            console.log("Failed updating buttons: " + err);
        }
        //let techAvailabilityFactor = currTechs % totalTechs;

        //$allCols.removeClass("btn-success btn-danger btn-success-in-1 btn-success-out-1 btn-danger-out-1")
        //    .addClass("slide-in-success slide-out-success slide-out-danger disabled") //custom class resets

    }

    function updateButtonFrontEndStates() { //**APPLY TO ALL # ACTIVE BTN SCENARIOS IF IT WORKS CONSISTENTLY*/
        const activeBtn = techButtons.filter('.btn-success');
        const lastAssignedBtn = techButtons.filter('.btn-danger');

        const currActiveIndex = techButtons.index(activeBtn);
        const nextActiveIndex = findNextActiveIndex(currActiveIndex);

        //Update styles for the active button - **ADD TRANSITIONS
        activeBtn.removeClass('btn-success text-warning border-warning')
            .addClass('text-secondary border-secondary');

        //update styles for last assigned button - **ADD TRANSITIONS
        if (lastAssignedBtn.length) {
            lastAssignedBtn.removeClass('btn-danger text-light border-secondary')
                .addClass('text-secondary border-secondary disabled')
                .attr('aria-disabled', 'true');
        }

        //set next active button - **TRANSITIONS!!
        const nextActiveBtn = $(techButtons[nextActiveIndex]);
        nextActiveBtn.removeClass('text-secondary border-secondary disabled')
            .addClass('btn-success text-warning border-warning')
            .attr('aria-disabled', 'false');

        //set curr active btn as last assigned when??
    }

    function applyFirstTimeoutCase1($curr) {
        return new Promise((resolve) => {
            setTimeout(() => {
                $curr.removeClass('btn-success-out-false btn-success text-warning border-warning')
                    .addClass('border-secondary text-secondary');
                console.log("After first timeout: " + $curr.attr("class"));
                resolve();
            }, 500);
        });
    }

    function applySecondTimeoutCase2($curr) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log("SECOND TIMEOUT");
                $curr.removeClass('btn-success-in-1 text-secondary border-secondary disabled')
                    .addClass('border-warning text-warning btn-success');
                console.log("After second timeout: " + $curr.attr("class"));
                resolve();
            }, 500);
        });
    }

    function allTechsAvailable(index) {
        const $curr = $('[data-index="' + index + '"]');
        const $currChild = $('[data-parent-index="' + index + '"]');
        const $next = $('[data-index="' + ((index + 1) % total) + '"]');
        const $nextChild = $('[data-parent-index="' + ((index + 1) % total) + '"]');
        return [$curr, $currChild, $next, $nextChild];
    }

    function oneTechAvailable(index) {
        const $curr = $('[data-index="' + index + '"]');
        const $currChild = $('[data-parent-index="' + index + '"]');
        return [$curr, $currChild];
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

            //connection.invoke("UpdateLastSelectedIndex", lastSelectedIndex).catch(function (err) {
            //    console.error(err.toString());
            //});

            //update data attrib
            $('.container-fluid').data('last-selected-index', (lastSelectedIndex + 1) % total);
        }
        event.preventDefault();
        return new Promise((resolve, reject) => {
            $.get("/Techs/CalculateCurrentSelectee", { techs, lastSelectedId })
                .done(function (response) {
                    if (response.success) {
                        /*$thisBtn.text(response.isAvailable ? "Deactivate" : "Activate");*/ //<--some version of this?
                        if (imgChild.hasClass('black-to-green')) imgChild.removeClass('black-to-green').addClass('black-to-red');
                        else imgChild.removeClass('black-to-red').addClass('black-to-green');
                        resolve(getAvailableTechsCount()
                            .then(function (count) {
                                return count;
                            }));
                    } else {
                        reject("Error: " + response.error);
                    }
                })
                .fail(function (jqXHR) {
                    alert("Error toggling Availability. Please try again.");
                });
        });
    });

    //toggle availability button
    $('.btn-row-group div[class*="toggle-btn"]').on("click", function (event) {
        event.preventDefault(); //<--remove if unnecessary
        //check for minimum # activated guys first
        var $thisBtn = $(this)
        var techId = $thisBtn.data("id");

        var imgChild = $(this).find('img');

        return new Promise((resolve, reject) => {
            $.post("/Techs/ToggleAvailability", { techId: techId })
                .done(function (response) {
                    if (response.success) {
                        /*$thisBtn.text(response.isAvailable ? "Deactivate" : "Activate");*/ //<--some version of this?
                        //need checks in place before automatically changing button color
                        if (imgChild.hasClass('black-to-green')) imgChild.removeClass('black-to-green').addClass('black-to-red');
                        else imgChild.removeClass('black-to-red').addClass('black-to-green');
                        resolve(getAvailableTechsCount()
                            .then(function (count) {
                                return count;
                            }));
                    } else {
                        if (response.error.includes("the last tech.")) {
                            alert(response.error);
                            return;
                        }
                        reject("Error: " + response.error);
                    }
                })
                .fail(function (jqXHR) {
                    alert("Error toggling Availability. Please try again.");
                });
        });

        //updateAvailableTechsCount();
    });

    async function getAvailableTechsCount() {
        try {
            const count = await fetchAvailableTechsCount();
            return count;
        } catch (err) {
            console.log("failed to retrieve available techs count: " + err);
            return 0;
        }
    }

    function fetchAvailableTechsCount() {
        return new Promise((resolve, reject) => {
            $.get("/Techs/GetAvailableTechsCount")
                .done(function (response) {
                    if (response.availableCount !== undefined) {
                        //utilize the # available
                        console.log(response.availableCount);
                        resolve(response.availableCount);
                    } else {
                        reject("Count not available");
                    }
                })
                .fail(function () {
                    alert("Error fetching number of available techs.");
                });
        });
    }

    async function getAllTechsCount() {
        try {
            const count = await fetchAllTechsCount();
            return count;
        } catch (err) {
            console.log("failed to retrieve total techs count: " + err);
            return 0;
        }
    }

    function fetchAllTechsCount() {
        return new Promise((resolve, reject) => {
            $.get("/Techs/GetAllTechs")
                .done(function (response) {
                    if (response.allTechsCount !== undefined) {
                        console.log(response.allTechsCount);
                        resolve(response.allTechsCount);
                    } else {
                        reject("Total # techs not available");
                    }
                })
                .fail(function () {
                    alert("Error fetching total # number of techs.");
                });
        })
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