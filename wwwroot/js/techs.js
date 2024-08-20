$(document).ready(function () { //on page load
    //console.log($('div[class*="toggle-btn"]').length);
    //network location: \\adhspace\ITSShare\donotdel-localapps\roundrobin
    const toggleButtons = $('div[class*="toggle-btn"]');
    const techButtons = $('div[class*="tech-queue-btn"]')
    const overrideButtons = $('div[class*="override-btn"]')

    //migrated what follows from index.cshtml & translated to jquery
    var $last = $('#LastSelectedIndex');
    var $curr = $('#CurrentSelectee');
    var $prev = $('#PrevLastSelectedIndex');
    var lastSel = parseInt($last.val());
    var currSel = parseInt($curr.val());
    var prevLastSel = parseInt($prev.val());

    console.log("Values at js initiation: \n($last): " + $last + "\n$curr: " + $curr + "\n$prev: " + $prev + "\nlastSel: " + lastSel + "\ncurrSel: " + currSel + "\nprevLast: " + prevLastSel);

    var queueIdToIdMap = {};
    var idToQueueIdMap = {};
    techViewModels.forEach(tech => {
        queueIdToIdMap[tech.QueueId] = tech.Id;
        idToQueueIdMap[tech.Id] = tech.QueueId;
        //migrated what precedes this from index.cshtml & translated to jquery

        //^^ALL OF THIS MAPPING STUFF IS ALREADY DONE IN THE ADDL SCRIPTS SECTION OF THE INDEX PAGE
        $(".col-6").off("click").on("click", async function (event) { //<--don't forget you can make the
            //anon functions async as well!
            //%%%%%% REMEMBER PARADIGM OF "LASTSELECTEDINDEX" BEING THE SAME
            //%%%%%% AS THE TECH CLASS' ID OF THE LAST PERSON CLICKED! **NOT**
            //%%%%%% A QUEUEID - BUT IT STILL NEEDS TO BE CONVERTED??

            event.preventDefault();
            var $t = $(this);
            if ($t.hasClass('disabled')) return;
            const index = $t.data('index');
            const queueId = $t.data('added-as-id');
            var techId = queueIdToIdMap[queueId];

            $prev.val($last.val());
            $last.val(index);

            try {
                const nextCurr = await updateLastSelectedIndex(techViewModels, techId);
                $curr.val(nextCurr);
            } catch (err) {
                alert("Error updating last selected index: " + err);
            }
        });
        //*******BEGINNING OF COMMENTED OUT BEGINNING SECTION 1*/
        //        var imgChild = $t.find('img');
        //        const $c = $('.container-fluid');
        //        const $curr = $('#CurrentSelectee');
        //        const $last = $('#LastSelectedIndex');
        //        const $prev = $('#PrevLastSelectedIndex');
        //        const currSelectedIndex = $curr.val();
        //        //const lastSelectedIndex = $('.container-fluid').data('last-selected-index');
        //        const lastSelectedIndex = $last.val();
        //        const prevLastSelectedIndex = $prev.val();
        //        console.log(lastSelectedIndex);
        //        //const index = $t.data("index");
        //        const queueId = $t.data('added-as-id');
        //        const lastSelectedToPrevLastSelectedId = prevLastSelectedIndex;
        //        $prev.val(lastSelectedIndex);
        //        $last.val(index);
        //        //$curr.val(index); //<--needs to get result of calc
        //        //$c.data('prev-last-selected-index', lastSelectedToPrevLastSelectedId);
        //        //$c.data('last-selected-index', queueId);
        //        /*lastSelectedIndex = index % total;*/
        //        console.log(queueIdToIdMap + "\n");
        //        console.log(idToQueueIdMap + "\n");
        //        const lastSelectedId = queueIdToIdMap[queueId];
        //        const prevLastSelectedId = queueIdToIdMap[lastSelectedToPrevLastSelectedId];    //a lot of this should be
        //        //^person in btn just clicked becomes lastsel                       //pre-click lastselected vals since
        //        //the c# function is formulating the
        //        //get latest tvmodels from dom or stored state:                     //new currselectee
        //        console.log("Original techviewmodels: ", techViewModels);
        //        var techs = techViewModels.map(tech => {
        //            console.log("Mapping tech: ", tech);
        //            return {
        //                Id: tech.Id,
        //                Name: tech.Name,
        //                IsAvailable: tech.IsAvailable,
        //                QueueId: tech.QueueId
        //            };
        //        });
        //        console.log(techs);
        //        const calculateSelecteeRequest = {
        //            techs: techs,
        //            lastSelectedId: lastSelectedId,
        //            prevLastSelectedId: prevLastSelectedId
        //        }
        //        try {
        //            const nextCurr = await updateLastSelectedIndex(techs, techId);
        //            $curr.val(nextCurr);
        //        } catch (err) {
        //            alert("Error updating last selected index: " + err);
        //}

        //*******END OF COMMENTED OUT BEGINNING SECTION 1*/
    });
    async function calculateNextSelectee(techs, lastSelectedId) {
        try {
            const response = await $.ajax({
                url: "/Techs/GetCurrentSelectee",
                type: "GET",
                contentType: "application/json",
                data: {
                    lastSelectedId: lastSel,
                    prevLastSelectedId: prevLastSel
                }
            })
            .done(function (response) {
                if (response.success) {
                    const lastSelectedIdx = idToQueueIdMap[response.lastSelectedId]
                    console.log(lastSelectedIdx);
                    const prevLastSelectedIdx = idToQueueIdMap[response.prevLastSelectedId];
                    console.log(prevLastSelectedIdx);
                    const currSelecteeIdx = idToQueueIdMap[response.currSelectee];
                    console.log(currSelecteeIdx);
                    //$('#CurrentSelectee').val(response.currSelectee);
                    //$('#LastSelectedId').val(response.lastSelectedId);
                    //$('#PrevLastSelectedId').val(response.prevLastSelectedId);
                    updateDOM(techs, lastSelectedIdx, currSelecteeIdx, prevLastSelectedIdx);
                    return response.currSelectee;
                } else {
                    alert("Error updating DOM & calculating current selectee: " + response.error);
                }
            });
        } catch (err) {
            alert("Error calculating next selectee: " + err);
        }
    }

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
    function updateDOM(techs, lastSelectedIndex, currentSelectee, prevLastSelectedIndex) { //does not need
        //to be async because: "[t]he updateDOM function is purely about reflecting the current state of the 
        //application in the browser's UI"
        const techButtons = $('.btn-row-group div[class*="tech-queue-btn"]');
        const $t = $(this);
        techButtons.each(function () {
            const techId = $(this).data('id');
            const tech = techs.find(t => t.Id === techId); //techs coming through as undef
            const availableTechs = techs.filter(t => t.IsAvailable).length;

            if (tech) { //**FOR 08/12/2024: SPLIT INTO =1, =2, AND >2
                const isCurrentSelectee = tech.QueueId === currentSelectee;
                const isLastAssigned = tech.QueueId === lastSelectedIndex;
                const isPrevLastAssigned = tech.QueueId === prevLastSelectedIndex;
                //^^Work out if all of the steps on this are correct

                if (availableTechs > 2) { //how to handle ones that went from lastassigned to regular white?
                    if (isCurrentSelectee) {
                        $t.addClass('btn-success-in-1').removeClass('disabled');
                        setTimeout(() => {
                            $t.removeClass('btn-success-in-1 border-secondary text-secondary')
                                .addClass('btn-success text-warning border-warning')
                                .prop("aria-disabled", "false");
                        }, 500);
                        //setTimeout(() => {
                        //    $(this).removeClass('btn-success-in-1 border-secondary text-secondary')
                        //        .addClass('btn-success text-warning border-warning')
                        //        .prop("aria-disabled", "false");
                        //}, 500);
                    }
                    else if (isLastAssigned) {
                        $t.addClass('btn-success-out-1').addClass('disabled');
                        setTimeout(() => {
                            $t.removeClass('btn-success-out-1 btn-success text-warning border-warning')
                                .addClass('btn-danger border-secondary text-light')
                                .prop("aria-disabled", "true");
                        }, 500);
                    }
                    else {
                        $t.addClass('button-danger-out-1')
                        setTimeout(() => {
                            $t.removeClass('btn-danger-out-1 btn-danger text-light')
                                .addClass('text-secondary')
                            if (!$t.hasClass('disabled')) $t.addClass('disabled');
                            var $ad = $t.attr('aria-disabled');
                            if ($ad !== undefined && $ad === "false") $t.attr("aria-disabled", "true");
                        }, 500);
                    }
                }

                else if (availableTechs === 2) {
                    if (isCurrentSelectee) {
                        $t.addClass('btn-danger-to-success').removeClass('disabled');
                        setTimeout(() => {
                            $t.removeClass('btn-danger-to-success btn-danger text-light border-secondary')
                                .addClass('btn-success text-warning border-warning')
                                .prop("aria-disabled", "false");
                        }, 500);
                    }
                    else if (isLastAssigned) {
                        $t.addClass('btn-success-out-1').addClass('disabled');
                        setTimeout(() => {
                            $t.removeClass('btn-success-out-1 btn-success text-warning border-warning')
                                .addClass('btn-danger border-secondary text-light')
                                .prop("aria-disabled", "true");
                        }, 500);
                    }
                    else {
                        $t.addClass('button-danger-out-1')
                        setTimeout(() => {
                            $t.removeClass('btn-danger-out-1 btn-danger text-light')
                                .addClass('text-secondary')
                            if (!$t.hasClass('disabled')) $t.addClass('disabled');
                            var $ad = $t.attr('aria-disabled');
                            if ($ad !== undefined && $ad === "false") $t.attr("aria-disabled", "true");
                        }, 500);
                    }
                }

                else if (availableTechs === 1) {
                    if (isCurrentSelectee) {
                        $t.addClass('btn-success-out-false');
                        //do any of the isLastAssigned or prevLastAssigned settings need to be addressed
                        //here? should we just leave them as they were?
                        setTimeout(() => {
                            $t.removeClass('btn-success-out-false');
                        }, 500);
                    }
                }

                const overrideBtn = $t.siblings('div[class*="override-btn"]');
                if (tech.IsAvailable && isCurrentSelectee) {
                    overrideBtn.removeClass('invisible').addClass('visible');
                }
                else {
                    overrideBtn.removeClass('visible').addClass('invisible');
                }
            }

        });

        //$('.container-fluid').data('prev-last-selected-index', prevLastSelectedIndex);
        //$('.container-fluid').data('last-selected-index', lastSelectedIndex);

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

    function btnDefaults() {
        const $allCols = $(".col-6");
        $allCols.removeClass("btn-success btn-danger btn-success-in-1 btn-success-out-1 btn-danger-out-1 text-light")
            .addClass("disabled")
            .prop("aria-disabled", "true");        //custom class resets
    }

    async function updateLastSelectedIndex(techs, lastSelectedId) {
        try {
            await $.post("/Techs/UpdateLastSelectedIndex", { techId: lastSelectedId });
            //^^^lastselectedid needs to be the one that just got clicked!
            const nextCurr = await calculateNextSelectee(techs, lastSelectedId);
            return nextCurr;
        } catch (err) {
            alert("Error updating last selected index: " + err);
        }
    }


    //toggle availability button
    $('.btn-row-group div[class*="toggle-btn"]').on("click", function (event) {
        event.preventDefault(); //<--remove if unnecessary
        //check for minimum # activated guys first
        var $t = $(this);
        var techId = $t.data("id");

        var imgChild = $t.find('img');

        return new Promise((resolve, reject) => {
            $.post("/Techs/ToggleAvailability", { techId: techId })
                .done(function (response) {
                    if (response.success) {
                        /*$thisBtn.text(response.isAvailable ? "Deactivate" : "Activate");*/ //<--some version of this?
                        //need checks in place before automatically changing button color
                        if (imgChild.hasClass('black-to-green')) imgChild.removeClass('black-to-green').addClass('black-to-red');
                        else imgChild.removeClass('black-to-red').addClass('black-to-green');
                        resolve(getAvailableTechsCount()
                            .then(count => count));
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
            $.get("/Techs/GetAllTechsCount")
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
        });

    }

    function fetchToggleTechAvailability(techId) {
        return $.ajax({
            url: '/Techs/ToggleAvailability',
            type: 'POST',
            data: { techId: techId }
        });
    }

    function setTechAvailability(techId) {
        fetchToggleTechAvailability(techId)
            .done(function (response) {
                if (response.success) {
                    if (response.IsAvailable) {
                        return "";
                    }
                }
                else {
                    alert("Error toggling availability from client side functions: " + error);
                }
            })
    }
});