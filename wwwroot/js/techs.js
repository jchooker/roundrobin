$(document).ready(function () { //on page load
    //console.log($('div[class*="toggle-btn"]').length);
    //network location: \\adhspace\ITSShare\donotdel-localapps\roundrobin
    const toggleButtons = $('div[class*="toggle-btn"]');
    const techButtons = $('div[class*="tech-queue-btn"]')
    const overrideButtons = $('div[class*="override-btn"]')
    var techViewModels = JSON.parse($('#TechList').val());

    //migrated what follows from index.cshtml & translated to jquery
    var $last = $('#LastSelectedIndex');
    var $curr = $('#CurrentSelectee');
    var $prev = $('#PrevLastSelectedIndex');
    console.log($last.val());
    var lastSel = parseInt($last.val());
    console.log("pre-click lastSel in hidden elem: " + lastSel);
    var currSel = parseInt($curr.val());
    console.log("pre-click currSel in hidden elem: " + currSel)
    var prevLastSel = parseInt($prev.val());
    var queueIdStateTracking = {
        currSelecteeIdx: {
            "pre-click": currSel,
            "post-click": null //<--needs to be determined from calc curr method
        },
        lastSelectedIdx: {
            "pre-click": lastSel,
            "post-click": currSel
        },
        prevLastSelectedIdx: {
            "pre-click": prevLastSel,
            "post-click": lastSel
        }
    }
    console.log(queueIdStateTracking);
    //^^These are all "pre-click", as are the "Sel" variables that use them...
    //MAKE SURE that's what needs to be handed to the Controller method
    //makes sense, if it is for setting prevLastSelected to pre-click
    //lastSelected and lastSelected to pre-click currentSelectee
    //consider making another dictionary that matches pre-click values with
    //post-click values, e.g. "[{'currSelectee': {'pre-click': 1, 'post-click' : 3} }, {'lastSelectedId': {'pre-click': 5, 'post-click': 1}}, {'prevLastSelectedId': {'pre-click': 4, 'post-click': 5}}]"

    //^^this is one of several locations where lastSelectedIdx can be taken
    //directly from currSelecteeIdx, and prevLastSelectedIdx can be taken
    //directly from lastSelectedIdx, since these values represent past selections,
    //and IsAvailable (almost) solely determines the next selectee

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

            const queueId = $t.data('added-as-id');
            var techId = $t.data('id');

            $prev.val($last.val());
            $last.val($curr.val());

            try {
                console.log(queueIdStateTracking);
                const nextCurr = await updateLastSelectedIndex(techViewModels, techId);
                //^^this correctly executing means last and prev have been updated in the json file
                $curr.val(nextCurr);
                queueIdStateTracking.currSelecteeIdx["post-click"] = nextCurr;

                console.log(queueIdStateTracking.lastSelectedIdx["post-click"]);
                console.log(queueIdStateTracking.prevLastSelectedIdx["post-click"]);
                console.log(queueIdStateTracking.currSelecteeIdx["post-click"]);
                updateDOM(techViewModels, queueIdStateTracking.lastSelectedIdx["post-click"],
                    queueIdStateTracking.currSelecteeIdx["post-click"], queueIdStateTracking.prevLastSelectedIdx["post-click"]);

                resetTrackingDictionary();//pulls from hidden values, need to make sure we're updating those
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

    function resetTrackingDictionary() { //latest issues here
        console.log($last.val());
        var lastSelNew = parseInt($last.val());
        console.log("pre-click lastSelNew in hidden elem: " + lastSelNew);
        var currSelNew = parseInt($curr.val());
        console.log("pre-click currSelNew in hidden elem: " + currSelNew);
        var prevLastSelNew = parseInt($prev.val());
        console.log("pre-click prevLastSelNew in hidden elem: " + prevLastSelNew);
        queueIdStateTracking.currSelecteeIdx["pre-click"] = currSelNew;
        queueIdStateTracking.currSelecteeIdx["post-click"] = null;
        queueIdStateTracking.lastSelectedIdx["pre-click"] = lastSelNew;
        queueIdStateTracking.lastSelectedIdx["post-click"] = currSelNew;
        queueIdStateTracking.prevLastSelectedIdx["pre-click"] = prevLastSelNew;
        queueIdStateTracking.prevLastSelectedIdx["post-click"] = lastSelNew;
    }

    function updateElsewhere() {
        var updatedData = {
            CurrentSelectee: $('#CurrentSelectee').val(),
            LastSelectedIndex: $('#LastSelectedIndex').val(),
            PrevLastSelectedIndex: $('#PrevLastSelectedIndex').val(),
            Techs: JSON.parse($('#techViewModels')).val()
        };
    }

    async function calculateNextSelectee(techs, lastSelectedId) {
        try { //eliminate this entirely, since the curr can be
            //determined simply by what they were "able to" click,
            //since only the "next available" gets made IsAvailable?
            const response = await $.ajax({
                url: "/Techs/GetCurrentSelectee",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                    techViewModels: techs,
                    currSelectee: null,
                    lastSelectedId: queueIdToIdMap[queueIdStateTracking.lastSelectedIdx["post-click"]],
                    prevLastSelectedId: queueIdToIdMap[queueIdStateTracking.prevLastSelectedIdx["post-click"]]
                }),
                dataType: "json"
            });

            if (response.success) {
                //const lastSelectedIdx = queueIdStateTracking.lastSelectedIdx["post-click"]
                //console.log(lastSelectedIdx);
                //const prevLastSelectedIdx = queueIdStateTracking.prevLastSelectedIdx["post-click"];
                //console.log(prevLastSelectedIdx);
                //const currSelecteeIdx = queueIdStateTracking.currSelecteeIdx["post-click"];
                //console.log(currSelecteeIdx);
                //$('#CurrentSelectee').val(response.currSelectee);
                //$('#LastSelectedId').val(response.lastSelectedId);
                //$('#PrevLastSelectedId').val(response.prevLastSelectedId);
                //updateDOM(techs, lastSelectedIdx, currSelecteeIdx, prevLastSelectedIdx);
                return response.currSelectee;
            } else {
                alert("Error updating DOM & calculating current selectee: " + response.error);
            }
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

    function clearOutClassesWithSubstring(element, substrings) {
        substrings.forEach(substring => {
            const classes = element.attr("class").split(" ").filter(function (c) {
                return c.includes(substring, 0) === 0;
            });
            if (classes.length > 0) element.removeClass(classes.join(" "));
        });

    }

    function updateDOM(techs, lastSelectedIndex, currentSelectee, prevLastSelectedIndex) { //does not need
        //to be async because: "[t]he updateDOM function is purely about reflecting the current state of the 
        //application in the browser's UI"
        const techButtons = $('.btn-row-group div[class*="tech-queue-btn"]');
        techButtons.each(function () {
            const techId = $(this).data('id');
            const tech = techs.find(t => t.Id === techId); //techs coming through as undef
            const availableTechs = techs.filter(t => t.IsAvailable).length;
            var substrings1 = ["text-", "border-"]

            if (tech) { //**FOR 08/12/2024: SPLIT INTO =1, =2, AND >2
                const $t = $(this);
                const isCurrentSelectee = tech.QueueId === currentSelectee;
                const isLastAssigned = tech.QueueId === lastSelectedIndex;
                const isPrevLastAssigned = tech.QueueId === prevLastSelectedIndex;
                //^^Work out if all of the steps on this are correct

                if (tech.QueueId === currentSelectee) { //important that this one is first for only 1-2 techs being active
                    if ($t.hasClass('btn-success')) {
                        $t.addClass('btn-success-out-false');
                        setTimeout(() => { //clearOut function not utilized bc borders and text colors remain the same
                            $t.removeClass('btn-success-out-false');
                        }, 500);
                    }
                    else if ($t.hasClass('btn-danger'))
                    {
                        $t.addClass('btn-danger-to-success').removeClass('disabled');
                        setTimeout(() => {
                            clearOutClassesWithSubstring($t, substrings1); //removes existing borders and text color bootstrap
                            $t.removeClass('btn-danger-to-success btn-danger') //...classes
                                .addClass('btn-success text-warning border-warning')
                                .prop("aria-disabled", "false");
                        }, 500);
                    }
                    else if ($t.hasClass('btn-basic-light'))
                    {
                        $t.addClass('btn-success-in-1').removeClass('disabled');
                        setTimeout(() => {
                            clearOutClassesWithSubstring($t, substrings1);
                            $t.removeClass('btn-success-in-1 btn-basic-light')
                                .addClass('btn-success text-warning border-warning')
                                .prop("aria-disabled", "false");

                            }, 500);
                        }//<------'btn-basic-light'!!! for white btns
                            //setTimeout(() => {
                            //    $(this).removeClass('btn-success-in-1 border-secondary text-secondary')
                            //        .addClass('btn-success text-warning border-warning')
                            //        .prop("aria-disabled", "false");
                    //}, 500);
                } else if (tech.QueueId === lastSelectedIndex) {
                    if ($t.hasClass('btn-success')) {
                        $t.addClass('btn-success-out-1');
                        if (!($t.hasClass('disabled'))) $t.addClass('disabled');
                        setTimeout(() => {
                            clearOutClassesWithSubstring($t, substrings1);
                            $t.removeClass('btn-success-out-1 btn-success border-warning')
                                .addClass('btn-danger text-light border-secondary')
                                .prop("aria-disabled", "false");
                        }, 500);
                    }
                    //$t.addClass('btn-danger').removeClass('btn-success');
                } else {
                    if ($t.hasClass('btn-danger')) {
                        $t.addClass('btn-danger-out-1');
                        if (!($t.hasClass('disabled'))) $t.addClass('disabled');
                        setTimeout(() => {
                            clearOutClassesWithSubstring($t, substrings1);
                            $t.removeClass('btn-danger-out-1 btn-danger text-light')
                                .addClass('text-secondary border-secondary btn-basic-light')
                                .prop("aria-disabled", "false");
                        }, 500);

                    }
                }

                //**********BEGIN NEED TO REACTIVATE*/
                //if (availableTechs > 2) { //how to handle ones that went from lastassigned to regular white?
                //    if (isCurrentSelectee) {
                //        $t.addClass('btn-success-in-1').removeClass('disabled');
                //        setTimeout(() => {
                //            $t.removeClass('btn-success-in-1 border-secondary text-secondary')
                //                .addClass('btn-success text-warning border-warning')
                //                .prop("aria-disabled", "false");
                //        }, 500);
                //        //setTimeout(() => {
                //        //    $(this).removeClass('btn-success-in-1 border-secondary text-secondary')
                //        //        .addClass('btn-success text-warning border-warning')
                //        //        .prop("aria-disabled", "false");
                //        //}, 500);
                //    }
                //    else if (isLastAssigned) {
                //        $t.addClass('btn-success-out-1').addClass('disabled');
                //        setTimeout(() => {
                //            $t.removeClass('btn-success-out-1 btn-success text-warning border-warning')
                //                .addClass('btn-danger border-secondary text-light')
                //                .prop("aria-disabled", "true");
                //        }, 500);
                //    }
                //    else {
                //        $t.addClass('button-danger-out-1')
                //        setTimeout(() => {
                //            $t.removeClass('btn-danger-out-1 btn-danger text-light')
                //                .addClass('text-secondary')
                //            if (!$t.hasClass('disabled')) $t.addClass('disabled');
                //            var $ad = $t.attr('aria-disabled');
                //            if ($ad !== undefined && $ad === "false") $t.attr("aria-disabled", "true");
                //        }, 500);
                //    }
                //}

                //else if (availableTechs === 2) {
                //    if (isCurrentSelectee) {
                //        $t.addClass('btn-danger-to-success').removeClass('disabled');
                //        setTimeout(() => {
                //            $t.removeClass('btn-danger-to-success btn-danger text-light border-secondary')
                //                .addClass('btn-success text-warning border-warning')
                //                .prop("aria-disabled", "false");
                //        }, 500);
                //    }
                //    else if (isLastAssigned) {
                //        $t.addClass('btn-success-out-1').addClass('disabled');
                //        setTimeout(() => {
                //            $t.removeClass('btn-success-out-1 btn-success text-warning border-warning')
                //                .addClass('btn-danger border-secondary text-light')
                //                .prop("aria-disabled", "true");
                //        }, 500);
                //    }
                //    else {
                //        $t.addClass('button-danger-out-1')
                //        setTimeout(() => {
                //            $t.removeClass('btn-danger-out-1 btn-danger text-light')
                //                .addClass('text-secondary')
                //            if (!$t.hasClass('disabled')) $t.addClass('disabled');
                //            var $ad = $t.attr('aria-disabled');
                //            if ($ad !== undefined && $ad === "false") $t.attr("aria-disabled", "true");
                //        }, 500);
                //    }
                //}

                //else if (availableTechs === 1) {
                //    if (isCurrentSelectee) {
                //        $t.addClass('btn-success-out-false');
                //        //do any of the isLastAssigned or prevLastAssigned settings need to be addressed
                //        //here? should we just leave them as they were?
                //        setTimeout(() => {
                //            $t.removeClass('btn-success-out-false');
                //        }, 500);
                //    }
                //}
                //********END NEED TO REACTIVATE*/

                const overrideBtn = $t.siblings('div[class*="override-btn"]');
                if (tech.IsAvailable) {
                    if (tech.isCurrentSelectee && overrideBtn.hasClass('visible')) {
                        overrideBtn.removeClass('visible').addClass('invisible');
                    }
                    else if(overrideBtn.hasClass('invisible')) {
                         overrideBtn.removeClass('invisible').addClass('visible');
                    }
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

    async function updateLastSelectedIndex(techs, postClickLastSelectedId) {
        try {
            await $.post("/Techs/UpdateLastSelectedIndex", { techId: postClickLastSelectedId });
            //^^^lastselectedid needs to be the one that just got clicked!
            const nextCurr = await calculateNextSelectee(techs, postClickLastSelectedId);
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