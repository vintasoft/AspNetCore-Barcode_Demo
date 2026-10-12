
// ================================================================================
// Working with cameras
// ================================================================================

/**
 Sets the device as active.
*/
function __setDeviceAsSelected(device) {
    if (device != undefined && !(device instanceof VideoInputDeviceJS))
        throw new Error("Argument type exception");
    // if previously selected device is defined
    if (_selectedDevice != undefined) {
        // stop playing video
        _selectedDevice.deactivate();
        $(_selectedDevice).off();
    }

    // set new device as selected
    _selectedDevice = device;

    __disableUIElement("stopImageCapturingButton");
    // if new selected device is defined
    if (_selectedDevice != undefined) {
        // activate device
        _selectedDevice.activate(_videoElement, function () {
            _selectedDevice.play();
            // stop video
            _selectedDevice.pause();

            __enableUIElement("startImageCapturingButton");
        });
        $(_selectedDevice).on("closed", function () { __setDeviceAsSelected(); });
    }
    else
        __disableUIElement("startImageCapturingButton");
}

/**
 Starts palying video on the active device.
*/
function __startVideo() {
    _selectedDevice.play();
    __startBarcodeRecognition();
    __disableUIElement("startImageCapturingButton");
    __enableUIElement("stopImageCapturingButton");
}

/**
 Stops palying video on the active device.
*/
function __stopVideo() {
    _selectedDevice.pause();
    __stopBarcodeRecognition();
    __enableUIElement("startImageCapturingButton");
    __disableUIElement("stopImageCapturingButton");
    __disableUIElement("startBarcodeReadingButton");
}

/**
 Selected video input is changed.
*/
function __videoSourceSelect_change() {
    // get new selected device id
    var newDeviceId = _deviceSelectList.value;
    // if selected device exist and have same id
    if (_selectedDevice != undefined && _selectedDevice.get_Id() === newDeviceId)
        // exit
        return;

    var newDevice = _videoInputDeviceManager.findDeviceById(newDeviceId);
    __setDeviceAsSelected(newDevice);
}

/**
 Refreshes list of available devices.
*/
function __refreshDevicesListButton_click() {
    // refresh the list of available video devices
    _videoInputDeviceManager.refreshDevices(__getVideoDevices_success);
}

/**
 Information about video devices is received successfully.
*/
function __getVideoDevices_success(videoInputDeviceManager) {
    var devices = videoInputDeviceManager.get_Devices();
    if (devices.length > 0) {
        // update information about available devices
        __updateDevicesList(devices);
        // if active device is NOT defined
        if (_selectedDevice == undefined)
            // use the first video device as active device
            __setDeviceAsSelected(devices[0]);
        else if (!_selectedDevice.isActived()) {
            _selectedDevice.activate(_videoElement, function () {
                _selectedDevice.play();
                // stop video
                _selectedDevice.pause();

                __enableUIElement("startImageCapturingButton");
            });
            __disableUIElement("stopImageCapturingButton");
        }
    }
    else {
        __clearDeviceSelectList();
        alert("Video devices are not found.");
    }
}

/**
 Updates information about available video devices in select element.
*/
function __updateDevicesList(devices) {
    // id of selected device
    var selectedDeviceId;
    // if selected device exists
    if (_selectedDevice != undefined)
        // get id
        selectedDeviceId = _selectedDevice.get_Id();

    __clearDeviceSelectList();

    _fillDeviceSelectList(devices);

    __selectDeviceInDeviceSelectList(selectedDeviceId);
}

/**
 Clears list with information about available video devices.
*/
function __clearDeviceSelectList() {
    _deviceSelectList.options.length = 0;
}

/**
 Writes information about available video devices in select element.
*/
function _fillDeviceSelectList(devices) {
    // for each device info
    for (var i = 0; i < devices.length; i++) {
        // create option for device select list
        var opt = __createOptionElementForDeviceSelectList(devices[i]);

        // add option to the device select list
        _deviceSelectList.appendChild(opt);
    }
}

/**
 Creates option element for the specified video device.
*/
function __createOptionElementForDeviceSelectList(device) {
    var deviceId = device.get_Id();

    // create option element
    var opt = document.createElement("option");
    // save information about device id
    opt.value = deviceId;
    // use device name as option text
    opt.text = device.get_Name();

    return opt;
}

/**
 Selects option element for the specified video device.
*/
function __selectDeviceInDeviceSelectList(selectedDeviceId) {
    // for each device info
    for (var i = 0; i < _deviceSelectList.options.length; i++) {
        // create option for device select list
        var opt = _deviceSelectList.options[i];

        // if current device is selected
        if (selectedDeviceId === opt.value) {
            // specify that option is selected
            opt.selected = true;
            break;
        }
    }
}


// ================================================================================
// Barcode reading, displaying barcode recognition results
// ================================================================================

/**
 Starts the barcode recognition.
*/
function __startBarcodeRecognition() {
    // get the active frame
    var image = _selectedDevice.captureFrameAsBase64String();
    // save reference to the active frame
    _barcodeRecognitionRequestImage = image;
    // send request to read barcodes
    var request = _barcodeReader.readBarcodesFromBase64(image, __readBarcode_success, __readBarcode_error);
    // save reference to the request object
    _activeRequest = request.object;

    // change the state of the interface elements
    __disableUIElement("recognitionIntervalSelect");
    __disableUIElement("startBarcodeReadingButton");
    __enableUIElement("stopBarcodeReadingButton");

    // get timeout
    var time = Number($("#recognitionIntervalSelect").val());
    // start the timer
    _barcodeRecognitionRequestTimer = setTimeout(__barcodeRecognitionRequestTimer_Handler, time);
}

/**
 Stops the barcode search.
*/
function __stopBarcodeRecognition() {
    // if timer exists
    if (_barcodeRecognitionRequestTimer != undefined) {
        // disable the timer
        clearTimeout(_barcodeRecognitionRequestTimer);
        // remove the timer
        _barcodeRecognitionRequestTimer = undefined;
    }

    // change the state of the interface elements
    __enableUIElement("startBarcodeReadingButton");
    __enableUIElement("recognitionIntervalSelect");
    __disableUIElement("stopBarcodeReadingButton");
}

/**
 Barcodes are recognized successfully.
*/
function __readBarcode_success(data) {
    // if barcodes are found
    if (data.results.length !== 0) {
        // write information about recognized barcodes
        var information = __getInformationAboutBarcodes(data.results);
        __writeInformationAboutBarcodes(information);

        // update canvas
        __updateCanvasContent(data.results);
    }
}

/**
 Barcode recognition is failed.
*/
function __readBarcode_error(data) {
    // write information about error
    __writeInformationAboutBarcodes("ERROR: " + data.errorMessage);
}

/**
 Starts the barcode recognition by timer.
*/
function __barcodeRecognitionRequestTimer_Handler() {
    // if barcode is NOT recognizing
    if (!_isBarcodeRecognizing) {
        // remove timer
        _barcodeRecognitionRequestTimer = undefined;

        // starts the barcode recognition
        __startBarcodeRecognition();
    }
}

/**
 Updates the canvas content.
*/
function __updateCanvasContent(barcodesInfoArray) {
    // create image
    var img = new Image();
    img.onload = function () {
        // get canvas
        var canvas = $("#frameCanvas")[0];
        var context = canvas.getContext('2d');

        // clear the canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        // draw the downloaded image
        context.drawImage(this, 0, 0);

        // for all found barcodes
        for (var i = 0; i < barcodesInfoArray.length; i++) {
            // get the barcode region
            var region = barcodesInfoArray[i].region;
            // draw barcode region on canvas
            __drawSelectionOnImage(context, region);
        }
    }
    // set the active frame as the image source
    img.src = _barcodeRecognitionRequestImage;
}

/**
 Draws selection for the specified region.
*/
function __drawSelectionOnImage(context, region) {
    context.beginPath();
    context.fillStyle = "rgba(0,233,0,0.5)";
    context.moveTo(region.rightTop.x, region.rightTop.y);
    context.lineTo(region.leftTop.x, region.leftTop.y);
    context.lineTo(region.leftBottom.x, region.leftBottom.y);
    context.lineTo(region.rightBottom.x, region.rightBottom.y);
    context.lineTo(region.rightTop.x, region.rightTop.y);
    context.fill();
}

/**
 Returns information about found barcodes.
*/
function __getInformationAboutBarcodes(barcodeInfoArray) {
    var result = "";
    // for each recognized barcode
    for (var i = 0; i < barcodeInfoArray.length; i++) {
        // get information about recognized barcode
        var item = barcodeInfoArray[i];
        // create a string with information about barcode
        var information = '[' + (i + 1) + ':' + item.barcodeType + ']\nValue: ' + item.value + '\nConfidence: ' + item.confidence +
            '\nReadingQuality: ' + item.readingQuality.toFixed(2) + '\nThreshold: ' + item.threshold + '\nRegion: ' +
            'LT=(' + item.region.leftTop.x + ',' + item.region.leftTop.y + '); RT=(' + item.region.rightTop.x + ',' + item.region.rightTop.y +
            '); LB=(' + item.region.leftBottom.x + ',' + item.region.leftBottom.y + '); RB=(' + item.region.rightBottom.x + ',' + item.region.rightBottom.y + '); Angle=' +
            item.region.angle.toFixed(1) + '°\n\n';
        result += information;
    }
    return result;
}


// ==========================================================
// Utils
// ==========================================================

/**
 Records information about found barcodes in the log.
*/
function __writeInformationAboutBarcodes(information) {
    var informationBox = $('#searchResultTextarea');
    $(informationBox).val(information);
}

/**
 Disables the button with the specified ID.
*/
function __disableUIElement(buttonId) {
    $("#" + buttonId).prop("disabled", true);
}

/**
 Enables the button with the specified ID.
*/
function __enableUIElement(buttonId) {
    $("#" + buttonId).prop("disabled", false);
}

/**
 Barcode type is changed.
*/
function __barcodeTypesSelect_changed() {

    var barcodeType = new Vintasoft.Barcode.WebBarcodeTypeEnumJS("None");
    var barcode1DSubset = new Vintasoft.Barcode.Web1DBarcodeSubsetNamesFlagedEnumJS("None");
    var barcode2DSubset = new Vintasoft.Barcode.Web2DBarcodeSubsetNamesFlagedEnumJS("None");

    var selectedOption = $("#barcodeTypesSelect option:selected");
    var selectedTypeValue = selectedOption.val();
    var selectedTypeAsNumber = Number(selectedTypeValue);
    if (!isNaN(selectedTypeAsNumber)) {
        barcodeType = barcodeType.add(new Vintasoft.Barcode.WebBarcodeTypeEnumJS(selectedTypeAsNumber));
    }
    else {
        var optGroup = selectedOption.parent();
        var groupLabel = optGroup.attr("label");
        if (groupLabel === "1DSubsets")
            barcode1DSubset = new Vintasoft.Barcode.Web1DBarcodeSubsetNamesFlagedEnumJS(selectedTypeValue);
        else if (groupLabel === "2DSubsets")
            barcode2DSubset = new Vintasoft.Barcode.Web2DBarcodeSubsetNamesFlagedEnumJS(selectedTypeValue);
    }

    var settings = _barcodeReader.get_Settings();
    settings.set_BarcodeType(barcodeType);
    settings.set_Barcode1DSubsets(barcode1DSubset);
    settings.set_Barcode2DSubsets(barcode2DSubset);
}

/**
 The barcode search parameters are changed.
*/
function __thresholdModeSelect_changed() {
    var mode = $("#thresholdModeSelect").val();
    var settings = _barcodeReader.get_Settings();
    switch (mode) {
        case "Automatic recognition":
            settings.set_AutomaticRecognition(true);
            break;
        case "Auto threshold":
            settings.set_AutomaticRecognition(false);
            settings.set_ThresholdMode(new Vintasoft.Barcode.WebThresholdModeEnumJS("Automatic"));
            break;
        default:
            var threshold = Number(mode);
            settings.set_AutomaticRecognition(false);
            settings.set_ThresholdMode(new Vintasoft.Barcode.WebThresholdModeEnumJS("Manual"));
            settings.set_Threshold(threshold);
            break;
    }
}





var sessionId = $("#hiddenSessionField").val();
Vintasoft.Shared.WebImagingEnviromentJS.set_SessionId(sessionId);

// barcode reader
var _barcodeReader = new Vintasoft.Barcode.WebBarcodeReaderJS(_barcodeService);
_barcodeReader.get_Settings().set_CollectTestInformation(false);

// device list
var _deviceSelectList = $("#videoSourceSelect")[0];
// video element
var _videoElement = $("#cameraVideoElement")[0];
// manager of video devices
var _videoInputDeviceManager = new VideoInputDeviceManagerJS();
// active video device
var _selectedDevice;

// a value indicating whether barcode reader is recognizing barcodes in captured image
var _isBarcodeRecognizing = false;
// an image, where barcode reader recognizes barcodes
var _barcodeRecognitionRequestImage;
// timer for barcode recognition request
var _barcodeRecognitionRequestTimer;

// listen UI events
$("#barcodeTypesSelect").on("change", __barcodeTypesSelect_changed);
$("#thresholdModeSelect").on("change", __thresholdModeSelect_changed);
$("#videoSourceSelect").on('change', __videoSourceSelect_change);
$("#refreshDevicesListButton").on("click", __refreshDevicesListButton_click);
$("#startImageCapturingButton").on("click", __startVideo);
$("#stopImageCapturingButton").on("click", __stopVideo);
$("#startBarcodeReadingButton").on("click", __startBarcodeRecognition);
$("#stopBarcodeReadingButton").on("click", __stopBarcodeRecognition);

// get video devices
_videoInputDeviceManager.refreshDevices(__getVideoDevices_success);

// update barcode reader settings
__barcodeTypesSelect_changed();
__thresholdModeSelect_changed();
