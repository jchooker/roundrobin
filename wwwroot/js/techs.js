$(document).ready(function () { //on page load
    //console.log($('div[class*="toggle-btn"]').length);
    //network location: \\adhspace\ITSShare\donotdel-localapps\roundrobin
    const toggleButtons = $('div[class*="toggle-btn"]');
    const techButtons = $('div[class*="tech-queue-btn"]');
    const overrideButtons = $('div[class*="override-btn"]');
    let lastCurrBeforeToggle; //<--may be distinct from lastSelected!
    var techViewModels = JSON.parse($('#TechList').val());

    //migrated what follows from index.cshtml & translated to jquery
    var $last = $('#LastSelectedIndex');
    var $curr = $('#CurrentSelectee');
    var $prev = $('#PrevLastSelectedIndex');
    console.log($last.val());
    var lastSel = parseInt($last.val());
    console.log("pre-click lastSel in hidden elem: " + lastSel + "\n and $last.val: " + parseInt($last.val()));
    var currSel = parseInt($curr.val());
    console.log("pre-click currSel in hidden elem: " + currSel)
    var prevLastSel = parseInt($prev.val());
    console.log("pre-click prevLastSel in hidden elem: " + $prev.val());
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

    setInterval(function () {
        updateRealtimeValues($curr.val(), $last.val(), $prev.val());
    }, 1000);

    function updateRealtimeValues(curr, last, prev) {
        var e = $('#real-time-values');
        $(e).attr('data-curr', curr);
        $(e).attr('data-last', last);
        $(e).attr('data-prev', prev);
    }

    function displayDebugJson(listOfDicts) {
        let result = '';

        listOfDicts.forEach((dictionary, index) => {
            result += `Dictionary ${index + 1}:\n`;

            for (const [key, value] of Object.entries(dictionary)) {
                result += `Key: ${key}, Value: ${value}\n`
            }

            result += '\n'
        });

        alert(result);
    }

    function displayDebugObject(str, obj) {
        alert(str + '\n' + JSON.stringify(obj, null, 2));
    }
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

            $prev.val($last.val()); //hidden html element values updated here
            $last.val($curr.val());

            try {
                let nextCurr = await updateLastSelectedIndex(techViewModels, techId);
                //^^this correctly executing means last and prev have been updated in the json file
                $curr.val(nextCurr);
                queueIdStateTracking.currSelecteeIdx["post-click"] = nextCurr;
                queueIdStateTracking.lastSelectedIdx["post-click"] = parseInt($last.val());
                queueIdStateTracking.prevLastSelectedIdx["post-click"] = parseInt($prev.val());

                updateDOM(techViewModels, queueIdStateTracking.lastSelectedIdx["post-click"],
                    queueIdStateTracking.currSelecteeIdx["post-click"], queueIdStateTracking.prevLastSelectedIdx["post-click"]);

                resetTrackingDictionary();//pulls from hidden values, need to make sure we're updating those
            } catch (err) {
                alert("Error updating last selected index: " + err);
            }
        });
    });

    function resetTrackingDictionary() { //latest issues here
        var lastSelNew = parseInt($last.val());
        var currSelNew = parseInt($curr.val());
        var prevLastSelNew = parseInt($prev.val());
        queueIdStateTracking.currSelecteeIdx["pre-click"] = currSelNew;
        queueIdStateTracking.currSelecteeIdx["post-click"] = null;
        queueIdStateTracking.lastSelectedIdx["pre-click"] = lastSelNew;
        queueIdStateTracking.lastSelectedIdx["post-click"] = currSelNew;
        queueIdStateTracking.prevLastSelectedIdx["pre-click"] = prevLastSelNew;
        queueIdStateTracking.prevLastSelectedIdx["post-click"] = lastSelNew;
    }

    async function updateOverride(techId) {
        try {
            const response = await $.ajax({
                url: "/Techs/ToggleAvailability",
                type: "POST",
                contentType: "application/json",
                data: { techId: techId }
            })
        } catch (ex) {
            console.log("Error of " + ex);
        }
    }

    async function calculateNextSelectee(techs, lastSelectedId, isToggleRequest = false) {
        let response;
        try { //eliminate this entirely, since the curr can be
            //determined simply by what they were "able to" click,
            //since only the "next available" gets made IsAvailable?
            const data = {
                techViewModels: techs,
                currentSelectee: null,
                lastSelectedIndex: queueIdStateTracking.lastSelectedIdx["post-click"],
                prevLastSelectedIndex: queueIdStateTracking.prevLastSelectedIdx["post-click"]
            };
            if (!isToggleRequest) {
                data.isToggleRequest = false;
                data.toggleTechId = null;
            }
            response = await $.ajax({
                url: "/Techs/GetCurrentSelectee",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(data),
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

            }
            //else if (!response.success && response.message.includes("dictionaries")) {
            //    displayDebugJson(response.dictionaries);
            //}
            else {
                alert("Error updating DOM & calculating current selectee: " + response.error);

            }
        } catch (err) {
            displayDebugJson(response.dictionaries);
            //alert("Error calculating next selectee: " + err);
        }
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

    function updateAfterTogglingOffCurrentSelectee(techs, toggleTechQueueId, lastSelectedIndex, currentSelectee) {
        var currTech = $('div.tech-queue-btn-' + currentSelectee);
        var lastTech = $('div.tech-queue-btn-' + lastSelectedIndex);
        var substrings1 = ["text-", "border-"];

        console.log(`currTech is: ${currTech}`);
        displayDebugObject('Techs as of toggle styling update', techs);

        //if the button you deactivate is success btn, and it must
        //1. go from white to green
        //2. go from red to green
        //3. go from green to green
        //4. go from
        //lastTech.removeClass('btn-success');
        //lastTech.addClass('')
        var currTechData = techs.find(t => t.QueueId == currentSelectee);
        console.log('%%%%%% update toggle val count check-currTech: ', currTech.length);
        console.log('%%%%%% update toggle val count check-lastTech: ', lastTech.length);
        console.log('%%%%%% update toggle val count check-currTechData: ', currTechData);
        if (!currTechData || !currTechData.IsAvailable) {
            console.error('Selected tech is unavailable or not found.');
            return;
        }
        /*if (currTech.hasClass('btn-basic-light') && (toggleTechQueueId === parseInt($curr.val()))) {*/
        if (currTech.hasClass('btn-basic-light')) {
            currTech.addClass('btn-success-in-1').removeClass('disabled');
            setTimeout(() => {
                clearOutClassesWithSubstring(currTech, substrings1);
                currTech.removeClass('btn-success-in-1 btn-basic-light')
                    .addClass('btn-success text-warning border-warning')
                    .prop("aria-disabled", "false");
            }, 400);
        }
        /*else if (currTech.hasClass('btn-danger') && (toggleTechQueueId === parseInt($curr.val()))) {*/
        else if (currTech.hasClass('btn-danger')) {
            currTech.addClass('btn-danger-to-success').removeClass('disabled');
            setTimeout(() => {
                clearOutClassesWithSubstring(currTech, substrings1);
                currTech.removeClass('btn-danger-to-success btn-danger')
                    .addClass('btn-success text-warning border-warning')
                    .prop("aria-disabled", "false");
            }, 400);
        }
        /* else if (currTech.hasClass('btn-success') && (toggleTechQueueId === parseInt($curr.val()))) {*/
        else if (currTech.hasClass('btn-success')) {
            currTech.addClass('btn-success-out-false-2').removeClass('disabled');
            setTimeout(() => {
                clearOutClassesWithSubstring(currTech, substrings1);
                currTech.removeClass('btn-success-out-false-2')
                    .addClass('btn-success text-warning border-warning')
                    .prop("aria-disabled", "false");
            }, 400);
        }
    }

    function updateDOM(techs, lastSelectedIndex, currentSelectee, prevLastSelectedIndex) { //does not need
        //to be async because: "[t]he updateDOM function is purely about reflecting the current state of the 
        //application in the browser's UI"
        const techButtons = $('.btn-row-group div[class*="tech-queue-btn"]');
        techButtons.each(function () {
            const techId = $(this).data('id');
            const tech = techs.find(t => t.Id === techId); //techs coming through as undef
            //const availableTechs = techs.filter(t => t.IsAvailable).length;
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
                        }, 400);
                    }
                    else if ($t.hasClass('btn-danger')) {
                        $t.addClass('btn-danger-to-success').removeClass('disabled');
                        setTimeout(() => {
                            clearOutClassesWithSubstring($t, substrings1); //removes existing borders and text color bootstrap
                            $t.removeClass('btn-danger-to-success btn-danger text-light') //...classes
                                .addClass('btn-success text-warning border-warning')
                                .prop("aria-disabled", "false");
                        }, 400);
                    }
                    else if ($t.hasClass('btn-basic-light')) {
                        $t.addClass('btn-success-in-1').removeClass('disabled');
                        setTimeout(() => {
                            clearOutClassesWithSubstring($t, substrings1);
                            $t.removeClass('btn-success-in-1 btn-basic-light')
                                .addClass('btn-success text-warning border-warning')
                                .prop("aria-disabled", "false");

                        }, 400);
                    }
                } else if (tech.QueueId === lastSelectedIndex) {
                    if ($t.hasClass('btn-success')) {
                        $t.addClass('btn-success-out-1');
                        if (!($t.hasClass('disabled'))) $t.addClass('disabled');
                        setTimeout(() => {
                            clearOutClassesWithSubstring($t, substrings1);
                            $t.removeClass('btn-success-out-1 btn-success border-warning text-warning')
                                .addClass('btn-danger text-light border-secondary')
                                .prop("aria-disabled", "false");
                        }, 400);
                    }
                    //$t.addClass('btn-danger').removeClass('btn-success');
                } else {
                    if ($t.hasClass('btn-danger')) {
                        $t.addClass('btn-danger-out-1');
                        if (!($t.hasClass('disabled'))) $t.addClass('disabled');
                        setTimeout(() => {
                            clearOutClassesWithSubstring($t, substrings1);
                            $t.removeClass('btn-danger-out-1 btn-danger text-light border-secondary')
                                .addClass('btn-basic-light text-secondary')
                                .prop("aria-disabled", "false");
                        }, 400);

                    }
                }

                const overrideBtn = $t.siblings('div[class*="override-btn"]');
                //^^compare .data("parent-index") (i.e. queueid) of both
                if (tech.IsAvailable || overrideBtn.data('queue-id') === queueIdStateTracking.currSelecteeIdx['post-click']) {
                    /*if (tech.QueueId === currSel && overrideBtn.hasClass('visible')) {*/
                    if (overrideBtn.hasClass('visible')) {
                        overrideBtn.removeClass('visible').addClass('invisible');
                    }
                    else if (overrideBtn.hasClass('invisible')) {
                        overrideBtn.removeClass('invisible').addClass('visible');
                    }
                }
                else {
                    overrideBtn.removeClass('visible').addClass('invisible');
                }

                if (tech.IsAvailable && tech.QueueId !== currentSelectee) {
                    overrideBtn.removeClass('invisible').addClass('visible');
                } else {
                    overrideBtn.removeClass('visible').addClass('invisible');
                }
            }

        });

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

    async function overrideCurrSelecteeIndex(techs, overrideTechQueueId) {
        try { //...the (queue)id of the tech whose toggle button was just clicked
            //const valCheckpoint = 
            const response = await $.ajax({
                url: "/Techs/PrepareDataForApproval",
                type: "POST",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify({
                    techViewModels: techs,
                    toggleOrOverrideTechId: queueIdToIdMap[overrideTechQueueId],
                    currentSelectee: parseInt($curr.val()),
                    lastSelectedIndex: queueIdStateTracking.lastSelectedIdx["pre-click"],
                    prevLastSelectedIndex: queueIdStateTracking.prevLastSelectedIdx["pre-click"],
                    //^^changed from post- to pre-click, because the toggle btn isn't generally meant to advance
                    //the queue
                    isToggleRequest: false,
                    isOverrideRequest: true
                })
            });

            if (response.success) {
                alert(`current selectee returned from override method: ${response.currentSelectee}`);
                const jsonData = response.jsonData || '';
                if (!jsonData) {
                    throw new Error("jsonData is empty or not provided by the server");
                }

                $('#jsonDataDisplay').text("Please review the data:\n\n" + JSON.stringify(JSON.parse(jsonData), null, 2) + "\n\nDo you approve?");
                $('#jsonModal').modal('show');
                //approve btn click
                const userApproval = await new Promise((resolve, reject) => {

                    $('#approveButton').off('click').on('click', async function () {
                        $('#jsonModal').modal('hide');
                        //await writeApprovedData(jsonData, toggleTechQueueId, true);
                        resolve(true);
                    });
                    $('#cancelBtn1, #cancelBtn2').off('click').on('click', function () {
                        $('#jsonModal').modal('hide');
                        alert("Data write canceled by user.");
                        resolve(false);
                    });

                });

                if (!userApproval) {
                    return;
                }

                await writeApprovedData(jsonData, overrideTechQueueId, false, true);

                $curr.val(response.currentSelectee);
                $last.val(response.lastSelected);
                $prev.val(response.prevLastSelected);

                alert(`value checks after override: \ncurr: ${$curr.val()} \nlast: ${$last.val()} \nprev: ${$prev.val()}`);

                queueIdStateTracking.currSelecteeIdx["post-click"] = parseInt($curr.val());

                //const jsonData = response.jsonData;

                techViewModels = response.techs;
                $('#TechList').val(JSON.stringify(techViewModels));
                $('#AvailableTechList').val(JSON.stringify(techViewModels.filter(t => t.IsAvailable)));

                //}
            } else if (!response.success && response.message.includes("deactivate last tech")) {
                alert(response.message);
            } else {
                alert(response.message);
            }
        } catch (err) {
            alert("Error preparing data: " + err);
        }
    }

    async function toggleTechAndSelectNext(techs, toggleTechQueueId) { //toggleTechId & techQueueId return
        try { //...the (queue)id of the tech whose toggle button was just clicked
            const response = await $.ajax({
                url: "/Techs/PrepareDataForApproval",
                type: "POST",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify({
                    techViewModels: techs,
                    toggleOrOverrideTechId: queueIdToIdMap[toggleTechQueueId],
                    currentSelectee: parseInt($curr.val()),
                    lastSelectedIndex: queueIdStateTracking.lastSelectedIdx["pre-click"],
                    prevLastSelectedIndex: queueIdStateTracking.prevLastSelectedIdx["pre-click"],
                    //^^changed from post- to pre-click, because the toggle btn isn't generally meant to advance
                    //the queue
                    isToggleRequest: true,
                    isOverrideRequest: false
                })
            });

            if (response.success) {
                //alert(response.message);
                const jsonData = response.jsonData || '';
                if (!jsonData) {
                    throw new Error("jsonData is empty or not provided by the server");
                }

                $('#jsonDataDisplay').text("Please review the data:\n\n" + JSON.stringify(JSON.parse(jsonData), null, 2) + "\n\nDo you approve?");
                $('#jsonModal').modal('show');
                //approve btn click
                const userApproval = await new Promise((resolve, reject) => {

                    $('#approveButton').off('click').on('click', async function () {
                        $('#jsonModal').modal('hide');
                        //await writeApprovedData(jsonData, toggleTechQueueId, true);
                        resolve(true);
                    });
                    $('#cancelBtn1, #cancelBtn2').off('click').on('click', function () {
                        $('#jsonModal').modal('hide');
                        alert("Data write canceled by user.");
                        resolve(false);
                    });

                });

                if (!userApproval) {
                    return;
                }

                await writeApprovedData(jsonData, toggleTechQueueId, true, false);

                $curr.val(response.currentSelectee);
                $last.val(response.lastSelected);
                $prev.val(response.prevLastSelected);

                queueIdStateTracking.currSelecteeIdx["post-click"] = parseInt($curr.val());

                //const jsonData = response.jsonData;

                techViewModels = response.techs;
                $('#TechList').val(JSON.stringify(techViewModels));
                $('#AvailableTechList').val(JSON.stringify(techViewModels.filter(t => t.IsAvailable)));

                //}
            } else if (!response.success && response.message.includes("deactivate last tech")) {
                alert(response.message);
            } else {
                alert(response.message);
            }
        } catch (err) {
            alert("Error preparing data: " + err);
        }
    }

    async function writeApprovedData(jsonData, toggleOrOverrideTechQueueId, isToggleRequest, isOverrideRequest) {
        try {
            //const finalMsg = "FINAL APPROVAL: " + "techQueueId value: " + toggleTechQueueId +
            //    " ; hidden html 'curr' value: " + parseInt($curr.val()) + "\n \n Send this data to server?: \n" + JSON.stringify(JSON.parse(jsonData), null, 2);
            //const finalApproval = confirm(finalMsg);
            //if (finalApproval) {
            const response = await $.ajax({
                url: "/Techs/WriteApprovedData",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(JSON.parse(jsonData)),
                dataType: "json"
            });

            if (response.success) {
                //alert(response.message);

                $curr.val(idToQueueIdMap[response.currentSelectee]);
                //^^WriteApprovedData passes Id, not Queue Id value (Tech instead of TechViewModel obj)
                //$last.val(response.lastSelected);
                //$prev.val(response.prevlastselected);
                if (!isToggleRequest && !isOverrideRequest) {
                    $last.val(response.lastSelected);
                    $prev.val(response.prevLastSelected);

                    queueIdStateTracking.lastSelectedIdx["post-click"] = parseInt($last.val());
                    queueIdStateTracking.prevLastSelectedIdx["post-click"] = parseInt($prev.val());
                }

                techViewModels = response.techs;

                $('#TechList').val(JSON.stringify(techViewModels));
                $('#AvailableTechList').val(JSON.stringify(techViewModels.filter(function (t) { return t.IsAvailable; })));

                // Update the tracking object as well
                queueIdStateTracking.currSelecteeIdx["post-click"] = parseInt($curr.val());

                if (toggleOrOverrideTechQueueId == lastCurrBeforeToggle) {
                    updateAfterTogglingOffCurrentSelectee(techViewModels, toggleOrOverrideTechQueueId, queueIdStateTracking.lastSelectedIdx["pre-click"], queueIdStateTracking.currSelecteeIdx["post-click"])
                }
            } else {
                alert("Error: " + response.message);
            }
            //} else {
            //    alert("User rescinded approval!");
            //}
        } catch (err) {
            alert("Error writing approved data: " + err);
        }
    }

    function lastStyleSweep() { //10.04.2024 - HOW DID JSON GET CURR VALUE OF 0???
        console.log("Total tech buttons: ", $(techButtons).length);
        console.log("Total override buttons: ", $(overrideButtons).length);
        var substrings1 = ["text-", "border-"];
        //toggle btns
        //queue btns
        try {
            $(techButtons).each(function (index, element) {
                //console.log("Current value from $curr.val():", $curr.val(), " and has type: ", typeof $curr.val(), "\nParsed value:", parseInt($curr.val()), "with type: ", typeof parseInt($curr.val()));
                console.log("Checking tech button with index: ", index, "which has type: ", typeof index, "\nCurrent selectee: ", parseInt($curr.val()), "which has type: ", typeof parseInt($curr.val()));

                if (index != parseInt($curr.val()) && index != parseInt($last.val())) {
                    console.log(index, " did not match the current selectee index");
                    if ($(this).hasClass('btn-success')) {
                        console.log("Removing success class...");
                        $(this).removeClass('btn-success text-warning border-warning')
                            .addClass('btn-basic-light text-secondary');
                    }
                }
                if (index == parseInt($curr.val())) {
                    $(this).removeClass('disabled');
                    if (!$(this).hasClass('btn-success')) {
                        $(this).addClass('btn-success-in-1')
                            .removeClass('btn-basic-light btn-danger');
                        clearOutClassesWithSubstring($(this), substrings1);
                        setTimeout(() => {
                            $(this).removeClass('btn-success-in-1 text-light')
                                .addClass('btn-success border-warning text-warning');
                        }, 400);
                    }
                }
                else if (index != parseInt($curr.val())) $(this).addClass('disabled');
                else if (index == parseInt($last.val())) {
                    if ($(this).hasClass('btn-success') || $(this).hasClass('border-warning')) {
                        $(this).removeClass('btn-success border-warning text-warning')
                            .addClass('btn-danger text-light border-secondary');
                    }
                }
            });
        }
        catch (err) {
            console.error("Error occurred in techButtons loop: ", err);
        }

        //override btns
        $(overrideButtons).each(function (index, element) {
            if (index == parseInt($curr.val())) {
                //var $overrideBtn = $('.override-btn-' + index);

                if (!$(this).hasClass('invisible')) {
                    //console.log("***adding invisible class");
                    $(this).addClass('invisible');
                } 

                if ($(this).hasClass('visible')) $(this).removeClass('visible');
            }
            let availableTechs = JSON.parse($('#AvailableTechList').val());
            let isTechAvailable = availableTechs.find(t => t.QueueId === index);
            if (isTechAvailable && (index !== parseInt($curr.val()))) {
                if ($(this).hasClass('invisible')) {
                    $(this).removeClass('invisible')
                    if (!$(this).hasClass('visible')) $(this).addClass('visible');
                }
                if ($(this).hasClass('btn-success')) {
                    if (index === parseInt($last.val())) {
                        $(this).removeClass('btn-success border-warning text-warning')
                            .addClass('btn-success-out-1');
                        setTimeout(() => {
                            $(this).removeClass('btn-success-out-1')
                                .addClass('btn-danger text-light border-secondary');
                        }, 400)
                    };
                }
            }
        });
    }


    //toggle availability button
    $('.btn-row-group div[class*="toggle-btn"]').on("click", async function (event) {
        event.preventDefault(); //<--remove if unnecessary

        //check for minimum # activated guys first
        var $t = $(this);
        var techId = $t.data("id");

        var imgChild = $t.find('img');

        var thisQueueId = $t.data('queue-id');

        lastCurrBeforeToggle = parseInt($curr.val());

        let currTechs = JSON.parse($('#TechList').val());

        //alert('queueIdToIdMap[queueIdStateTracking.lastSelectedIdx["post-click"]]: ' + queueIdToIdMap[queueIdStateTracking.lastSelectedIdx["post-click"]] + '\n'
        //    + 'queueIdToIdMap[queueIdStateTracking.prevLastSelectedIdx["post-click"]]: ' + queueIdToIdMap[queueIdStateTracking.prevLastSelectedIdx["post-click"]] + '\n'
        //    + 'parseInt($curr.val()): ' + parseInt($curr.val()));

        toggleTechAndSelectNext(currTechs, thisQueueId)
            .then(function (success) {
                if (imgChild.hasClass('black-to-green')) {
                    imgChild.removeClass('black-to-green')
                        .addClass('black-to-red');
                    $(`div.override-btn-${thisQueueId}`)
                        .removeClass('visible')
                        .addClass('invisible');
                }
                else if (imgChild.hasClass('black-to-red')) {
                    imgChild.removeClass('black-to-red')
                        .addClass('black-to-green');
                    alert(`this QueueId: ${thisQueueId} **vs*** $curr val: ${parseInt($curr.val())}`);
                    if (thisQueueId != parseInt($curr.val())) {
                        $(`div.override-btn-${thisQueueId}`)
                            .removeClass('invisible')
                            .addClass('visible');
                    }
                }
                lastStyleSweep();
            });
    });

    $('.btn-row-group div[class*="override-btn"').on("click", function (event) {
        //^^^DON'T MIX UP TOGGLE AND OVERRIDE JS FUNCTIONS WITH THIS!
        event.preventDefault();
        var $t = $(this);
        var thisTechIndex = $t.data('parent-index');
        let currTechs = JSON.parse($('#TechList').val());
        if (currTechs) {
            let currTech = currTechs.find(t => t.QueueId === thisTechIndex);
            if (currTech && currTech.IsAvailable) {
                currTechs.CurrentSelectee = currTech.QueueId;
                $curr.val(currTech.QueueId);
                queueIdStateTracking.currSelecteeIdx["pre-click"] = currTech.QueueId;
                overrideCurrSelecteeIndex(techViewModels, currTech.QueueId);
                //updateDOM(techViewModels, lastSel, currSel, prevLastSel);
                //alert("new current tech at queue id pos: " + currTech.QueueId);
            }
            lastStyleSweep();
        }
        //^^MIGHT REMOVE AVAILABLE TECH LIST IN HIDDEN ELEMENT SO I'M NOT UPDATING IN TWO PLACES!
        const overrideBtn = $t.siblings('div[class*="override-btn"]');

    });

    function updateOverrideIsAvailable(techViewModels, queueId) {
        let tech = techViewModels.find(t => t.QueueId === queueId);
        tech.IsAvailable = !tech.IsAvailable;
    }

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