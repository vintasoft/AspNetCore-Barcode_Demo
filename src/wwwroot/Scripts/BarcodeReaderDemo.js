var sessionId = $("#hiddenSessionField").val();
Vintasoft.Shared.WebImagingEnviromentJS.set_SessionId(sessionId);

var source = new Vintasoft.Shared.WebImageSourceJS("AllSupportedBarcodes.png");
var activeImage = new Vintasoft.Shared.WebImageJS(source, 0);
var canvas = document.getElementById("selectionCanvas");

// barcode reader
var _barcodeReader = new Vintasoft.Barcode.WebBarcodeReaderJS(_barcodeService);
// barcode reader settings
var _barcodeReaderSettings = new Vintasoft.Barcode.WebBarcodeReaderSettingsJS();

var _defaultBarcodeTypes = new Vintasoft.Barcode.WebBarcodeTypeEnumJS("Code39");
_defaultBarcodeTypes = _defaultBarcodeTypes.add("Code128");
_defaultBarcodeTypes = _defaultBarcodeTypes.add("EAN13");
_defaultBarcodeTypes = _defaultBarcodeTypes.add("UPCA");

_barcodeReaderSettings.set_BarcodeType(_defaultBarcodeTypes);

_barcodeReaderSettings.set_PharmacodeMaxValue(1000000000);
_barcodeReaderSettings.set_SearchOneBarWidePharmacode(true);

// array that contains information about recognized barcodes
var _barcodeInformation;
// array that contains information about quality tests of recognized barcodes
var _qualityTestInformation;

var __defaultInformationMessage = 'Please do the following steps for reading barcode:\n\n1. Click the "Barcode Reader Settings" button and specify necessary settings.\n\n2. Click the "Read Barcodes" button and barcode recognition results will be shown in this text box.\n\n3. Click on highlighted barcode in image viewer and you will see an extended information about recognized barcode.';
$('#barcodeInformationTextBox').val(__defaultInformationMessage);

// default settings for dialog with barcode reader settings
var _dialogSettings = {
    title: 'Barcode Reader Settings',
    width: 580,
    height: 580,
    show: {
        effect: "blind",
        duration: 800
    },
    hide: {
        effect: "exlpode",
        duration: 1000
    },
    buttons: [
        {
            text: "OK",
            click: function () {
                $(this).dialog("close");
            }
        }],
    modal: true,
    closeOnEscape: true,
    resizable: false,
    draggable: true
};



$("#ReadBarcodes").on("click", __sendReadBarcodeRequest);
$("#BarcodeReaderSettings").on("click", __showBarcodeReaderSettings);
$("#uploadedImage").on("load", __imageLoaded);
$("#selectionCanvas").on("dblclick", __onImageDoubleClick);
$("#closeErrorMessageDialog").on("click", __closeErrorMessageDialog);


// ==============================================================================
// Upload an image file with barcodes to a server
// ==============================================================================

/**
 Uploads a file to a server.
*/
function uploadImage(files) {
    var data = new FormData();
    data.append("file", files[0]);
    var ajaxParams = {
        type: 'POST',
        contentType: false,
        processData: false,
        data: data
    }
    var uploadRequest = new Vintasoft.Shared.WebRequestJS("UploadImageFile", __upload_success, __upload_error, ajaxParams);
    _barcodeService.sendRequest(uploadRequest);

    __clearSelections();
    _barcodeInformation = undefined;
    _qualityTestInformation = undefined;
    $('#barcodeInformationTextBox').val(__defaultInformationMessage);
}

/**
 Image file is uploaded successfully.
*/
function __upload_success(data) {
    if (data.errorMessage != undefined) {
        $("#fileInput").val('');
        alert(data.errorMessage);
    }
    else {
        var source = new Vintasoft.Shared.WebImageSourceJS(data.imageInfo.fileInfo.id);
        activeImage = new Vintasoft.Shared.WebImageJS(source, data.imageInfo.pageIndex);
        document.getElementById("uploadedImage").src = data.base64String;
    }
}

/**
 Image file uploading is failed.
*/
function __upload_error(data, status, e) {
    $("#fileInput").val('');
    if (data.errorMessage != undefined) {
        $("#errorMessageDialogContent").html(data.errorMessage);
        $("#errorMessageDialog").css("display", "block");
    }
    else if (data.responseText != undefined) {
        $("#errorMessageDialogContent").html(data.responseText);
        $("#errorMessageDialog").css("display", "block");
    }
}

/**
 Closes the dialog with error message.
*/
function __closeErrorMessageDialog() {
    $("#errorMessageDialog").css("display", "none");
    $("#errorMessageDialogContent").html("");
}

/**
 Image is loaded in image control.
*/
function __imageLoaded(event) {
    canvas.width = this.width;
    canvas.height = this.height;
    var canvasLeft = 0;
    if (canvas.width < 680)
        canvasLeft = (680 - canvas.width) / 2;
    $(canvas).css("left", canvasLeft);
    var canvasTop = 0;
    if (canvas.height < 600)
        canvasTop = (600 - canvas.height) / 2;
    $(canvas).css("top", canvasTop);
    $(this).css("margin-top", canvasTop);
}



// ==============================================================================
// The barcode recognition settings
// ==============================================================================

/**
 Shows a modal window with barcode reader settings.
*/
function __showBarcodeReaderSettings() {
    // create WebPropertyGridJS
    var propertyGrid = new Vintasoft.Shared.WebPropertyGridJS(_barcodeReaderSettings);
    // create PropertyGridControl with default settings
    var propertyGridControl = new PropertyGridControlJS(propertyGrid, "barcodeReaderSettingGrid");
    // create property grid dialog
    new PropertyGridDialogJS(propertyGridControl, "barcodeReaderSettingDialog", _dialogSettings,
        { hideNestedElements: false, showReadOnlyElements: false });
}



// ==============================================================================
// Read barcodes from image
// ==============================================================================

/**
 Sends a request to recognize barcodes.
*/
function __sendReadBarcodeRequest() {
    if (activeImage != undefined) {
        $("#ReadBarcodes").prop('disabled', true);
        $("#BarcodeReaderSettings").prop('disabled', true);
        $("#fileInput").prop('disabled', true);

        // reset information about recognized barcodes
        _barcodeInformation = Array();

        // show a message about start of barcode recognition
        $('#barcodeInformationTextBox').val('Recognition...');

        // clear selection regions on image
        __clearSelections();

        // set the barcode recognition settings
        _barcodeReader.set_Settings(_barcodeReaderSettings);

        // send a request to recognize barcodes.
        _barcodeReader.readBarcodes(activeImage, __readBarcodes_success, __readBarcodes_fail);
    }
    return false;
}

/**
 Barcodes are recognized successfully.
*/
function __readBarcodes_success(data) {
    // save information about recognized barcodes
    _barcodeInformation = data.results;

    var info = "Recognition time: " + data.recognitionTime + " ms\n\n";
    // if no barcodes found
    if (_barcodeInformation.length == 0) {
        // show a message with the barcode recognition result
        info += 'No barcodes found.\n\n You should try to change barcode recognition settings, for example decrease scan interval, add new scan direction, etc if you are sure that image contains a barcode.\n\n Please send image with barcode to support@vintasoft.com if you cannot recognize barcode - we will do the best to help you.';
    }
    // else
    else {
        info += 'Found ' + _barcodeInformation.length + ' barcodes.\n\n';
        for (var i = 0; i < _barcodeInformation.length; i++) {
            var barcodeInfo = _barcodeInformation[i];
            __drawSelectionOnImage(barcodeInfo.region);

            info += '[' + (i + 1) + ':' + barcodeInfo.barcodeType + ']\n';

            if (barcodeInfo.barcodeType == "Mailmark CMDM Type7" || barcodeInfo.barcodeType == "Mailmark CMDM Type9" ||
                barcodeInfo.barcodeType == "Mailmark CMDM Type29") {
                info += 'Decoded value: ' + '\n' +
                    '===\n' +
                    __createMarkupWithInformationAboutMailmarkCMDMBarcode(barcodeInfo, false, '\n') + '\n' +
                    '===\n\n';
            }
            else if (barcodeInfo.barcodeType == "PPN") {
                info += 'Decoded value: ' + '\n' +
                    '===\n' +
                    __createMarkupWithInformationAboutPpnBarcode(barcodeInfo, false, '\n') + '\n' +
                    '===\n\n';
            }
            else if (barcodeInfo.barcodeType == "AAMVA") {
                info += 'Decoded value: ' + '\n' +
                    '===\n' +
                    __createMarkupWithInformationAboutAamvaBarcode(barcodeInfo, false, '\n') + '\n' +
                    '===\n\n';
            }
            else if (barcodeInfo.barcodeType == "Swiss QR Code") {
                info += 'Decoded value: ' + '\n' +
                    '===\n' +
                    __createMarkupWithInformationAboutSwissQrCodeBarcode(barcodeInfo, false, '\n') + '\n' +
                    '===\n\n';
            }
            else if (barcodeInfo.barcodeType == "IATA BCBP Aztec" || barcodeInfo.barcodeType == "IATA BCBP DataMatrix" ||
                barcodeInfo.barcodeType == "IATA BCBP PDF417" || barcodeInfo.barcodeType == "IATA BCBP QR Code") {
                info += 'Decoded value: ' + '\n' +
                    '===\n' +
                    __createMarkupWithInformationAboutIataBcbpBarcode(barcodeInfo, false, '\n') + '\n' +
                    '===\n\n';
            }
            else if (barcodeInfo.barcodeType.substring(0, 3) == "GS1") {
                info += 'Value: ' + barcodeInfo.value + '\n\n' +
                    'Base value: ' + barcodeInfo.baseValue + '\n\n' +
                    'GS1 decoded value: ' + '\n' +
                    '===\n' +
                    __createMarkupWithInformationAboutGS1Barcode(barcodeInfo, false, '\n') + '\n' +
                    '===\n\n';
            }
            else {
                info += 'Value: ' + barcodeInfo.value + '\n';
            }

            info += 'Confidence: ' + barcodeInfo.confidence + '\n' +
                'Reading quality: ' + barcodeInfo.readingQuality.toFixed(2) + '\n' +
                'Threshold: ' + barcodeInfo.threshold + '\n' +
                'Region: ' +
                'LT=(' + barcodeInfo.region.leftTop.x + ',' + barcodeInfo.region.leftTop.y +
                '); RT=(' + barcodeInfo.region.rightTop.x + ',' + barcodeInfo.region.rightTop.y +
                '); LB=(' + barcodeInfo.region.leftBottom.x + ',' + barcodeInfo.region.leftBottom.y +
                '); RB=(' + barcodeInfo.region.rightBottom.x + ',' + barcodeInfo.region.rightBottom.y +
                '); Angle=' + barcodeInfo.region.angle.toFixed(1) + '°\n\n';
        }
    }
    $('#barcodeInformationTextBox').val(info);

    $("#ReadBarcodes").prop('disabled', false);
    $("#BarcodeReaderSettings").prop('disabled', false);
    $("#fileInput").prop('disabled', false);
}

/**
 Barcode recognition is failed.
*/
function __readBarcodes_fail(data) {
    $('#barcodeInformationTextBox').val('');

    if (data.errorMessage)
        alert(data.errorMessage);
    else {
        // if error occurred during the request (request was not aborted)
        if (data.statusText !== "abort")
            // show information about error
            alert(data.responseJSON.ExceptionMessage);
    }

    $("#ReadBarcodes").prop('disabled', false);
    $("#BarcodeReaderSettings").prop('disabled', false);
    $("#fileInput").prop('disabled', false);
}



// ==============================================================================
// Show the barcode recognition result
// ==============================================================================

/**
 Mouse button is double clicked on image.
*/
function __onImageDoubleClick(event) {
    if (_barcodeInformation != undefined) {
        var x = event.pageX;
        var y = event.pageY;
        var canvasOffset = $("#selectionCanvas").offset();
        var p = { x: x - canvasOffset.left, y: y - canvasOffset.top };
        for (var i = 0; i < _barcodeInformation.length; i++) {
            var item = _barcodeInformation[i]
            var region = item.region;
            if (__isPointInQuadrangle(region.leftTop, region.rightTop, region.rightBottom, region.leftBottom, p)) {
                var barcodeQualityTestInfo;
                // if information about quality tests exist
                if (item.printQualityTest != undefined)
                    // get information about the print quality test of recognized barcode
                    barcodeQualityTestInfo = item.printQualityTest;

                // create a modal window with the barcode reading result
                $('#barcodeInformationDialog').dialog({
                    title: 'Barcode Information',
                    height: 580,
                    width: 500,
                    // open
                    open: function () {
                        // creates a HTML markup for modal window with the barcode reading result
                        var htmlMarkup = __createHtmlMarkupForBarcodeReadingResult(item, barcodeQualityTestInfo);
                        // set the HTML markup of modal window
                        $('#barcodeInformationDialog').html(htmlMarkup);
                    },
                    modal: true,
                    buttons: [
                        {
                            text: "OK",
                            click: function () {
                                $(this).dialog("close");
                            }
                        }],
                    resizable: false,
                    draggable: false,
                    closeOnEscape: true
                });
                return;
            }
        }
    }
}

/**
 Creates a HTML markup for modal window with the barcode reading result.
*/
function __createHtmlMarkupForBarcodeReadingResult(barcodeInfo, barcodeQualityTestInfo) {
    var htmlMarkup = '<b>Barcode type: </b>' + barcodeInfo.barcodeType + '<br />';

    if (barcodeInfo.barcodeType == "Mailmark CMDM Type7" || barcodeInfo.barcodeType == "Mailmark CMDM Type9" || barcodeInfo.barcodeType == "Mailmark CMDM Type29") {
        htmlMarkup += '<b>Value: </b><br />';
        htmlMarkup += __createMarkupWithInformationAboutMailmarkCMDMBarcode(barcodeInfo, true, '<br />') + '<br />';
        htmlMarkup += '<b>Base value: </b>' + __replaceSpecialHtmlChars(barcodeInfo.baseValue) + '<br />';
    }
    else if (barcodeInfo.barcodeType == "PPN") {
        htmlMarkup += '<b>Value: </b><br />';
        htmlMarkup += __createMarkupWithInformationAboutPpnBarcode(barcodeInfo, true, '<br />') + '<br />';
        htmlMarkup += '<b>Base value: </b>' + __replaceSpecialHtmlChars(barcodeInfo.baseValue) + '<br />';
    }
    else if (barcodeInfo.barcodeType == "AAMVA") {
        htmlMarkup += '<b>Value: </b><br />';
        htmlMarkup += __createMarkupWithInformationAboutAamvaBarcode(barcodeInfo, true, '<br />') + '<br />';
        htmlMarkup += '<b>Base value: </b>' + __replaceSpecialHtmlChars(barcodeInfo.baseValue) + '<br />';
    }
    else if (barcodeInfo.barcodeType == "Swiss QR Code") {
        htmlMarkup += '<b>Value: </b><br />';
        htmlMarkup += __createMarkupWithInformationAboutSwissQrCodeBarcode(barcodeInfo, true, '<br />') + '<br />';
        htmlMarkup += '<b>Base value: </b>' + __replaceSpecialHtmlChars(barcodeInfo.baseValue) + '<br />';
    }
    else if (barcodeInfo.barcodeType == "IATA BCBP Aztec" || barcodeInfo.barcodeType == "IATA BCBP DataMatrix" ||
        barcodeInfo.barcodeType == "IATA BCBP PDF417" || barcodeInfo.barcodeType == "IATA BCBP QR Code") {
        htmlMarkup += '<b>Value: </b><br />';
        htmlMarkup += __createMarkupWithInformationAboutIataBcbpBarcode(barcodeInfo, true, '<br />') + '<br />';
        htmlMarkup += '<b>Base value: </b>' + __replaceSpecialHtmlChars(barcodeInfo.baseValue) + '<br />';
    }
    else if (barcodeInfo.barcodeType.substring(0, 3) == "GS1") {
        htmlMarkup += '<b>Value: </b>' + __replaceSpecialHtmlChars(barcodeInfo.value) + '<br />';
        htmlMarkup += '<b>Base value: </b>' + __replaceSpecialHtmlChars(barcodeInfo.baseValue) + '<br />';
        htmlMarkup += '<b>GS1 Decoded value: </b><br />';
        htmlMarkup += '===<br />';
        htmlMarkup += __createMarkupWithInformationAboutGS1Barcode(barcodeInfo, true, '<br />') + '<br />';
        htmlMarkup += '===<br />';
    }
    else {
        htmlMarkup += '<b>Value: </b>' + __replaceSpecialHtmlChars(barcodeInfo.value) + '<br />';
        if (barcodeInfo.baseValue != null && barcodeInfo.value != barcodeInfo.baseValue) {
            htmlMarkup += '<b>Base value: </b>' + __replaceSpecialHtmlChars(barcodeInfo.baseValue) + '<br />';
        }
    }

    htmlMarkup += '<b>Confidence: </b>' + barcodeInfo.confidence + '<br />';
    htmlMarkup += '<b>Reading quality: </b>' + barcodeInfo.readingQuality.toFixed(2) + '<br />';
    htmlMarkup += '<b>Threshold: </b>' + barcodeInfo.threshold + '<br />';
    htmlMarkup += '<b>Region: </b>' + 'LT=(' + barcodeInfo.region.leftTop.x + ',' + barcodeInfo.region.leftTop.y + '); RT=(' + barcodeInfo.region.rightTop.x + ',' + barcodeInfo.region.rightTop.y +
        '); LB=(' + barcodeInfo.region.leftBottom.x + ',' + barcodeInfo.region.leftBottom.y + '); RB=(' + barcodeInfo.region.rightBottom.x + ',' + barcodeInfo.region.rightBottom.y + '); Angle=' +
        barcodeInfo.region.angle.toFixed(1) + '°<br />';
    // 1D
    if (barcodeInfo.narrowBarCount) {
        htmlMarkup += '<b>NarrowBarCount: </b>' + barcodeInfo.narrowBarCount + '<br />';
        htmlMarkup += '<b>NarrowBarSize: </b>' + barcodeInfo.narrowBarSize.toFixed(2) + '<br /><br />';
    }
    // 2D
    else if (barcodeInfo.matrixSize) {
        htmlMarkup += '<b>Matrix size: </b>' + barcodeInfo.matrixSize.x + "x" + barcodeInfo.matrixSize.y + '<br />';
        htmlMarkup += '<b>Cell size: </b>' + barcodeInfo.cellSize.x.toFixed(2) + "x" + barcodeInfo.cellSize.y.toFixed(2) + '<br />';
        if (barcodeInfo.bulleyeCenter != undefined)
            htmlMarkup += '<b>Bulleye center: </b>' + barcodeInfo.bulleyeCenter.x.toFixed(2) + "x" + barcodeInfo.bulleyeCenter.y.toFixed(2) + '<br />';
        htmlMarkup += "<br />"
    }
    htmlMarkup += '<b>HEX Value: </b><br /><div style="font-family:\'Courier New\'">' + barcodeInfo.hexValue + '</div>';
    if (barcodeInfo.additionalInfo != undefined) {
        htmlMarkup += '<br /><b>Addition Info: </b><br />';
        htmlMarkup += __createMarkupForAdditionInfo(barcodeInfo.additionalInfo);
    }
    htmlMarkup += "<br /><b>Barcode Print Quality Test Information</b>:<br />";
    if (barcodeQualityTestInfo != undefined) {
        if (barcodeQualityTestInfo.tests != undefined) {
            htmlMarkup += __createMarkupForISO15416TestResult(barcodeQualityTestInfo.tests);
        }
        else {
            htmlMarkup += __createMarkupForISO15415TestResult(barcodeQualityTestInfo);
        }
    }
    else {
        if (_barcodeReaderSettings.get_CollectTestInformation()) {
            htmlMarkup += "Barcode print quality test is not supported for this barcode type.<br />";
        }
        else {
            htmlMarkup += "Barcode print quality test information is not collected. Please open 'Reader Settings' and set value of 'CollectTestInformation' property to 'true' if you want to collect the barcode print quality test information.<br />";
        }
    }

    return htmlMarkup;
}

/**
 Creates a HTML markup with information about recognized Mailmark CMDM barcode.
 @param {object} barcodeInfo Information about barcode.
 @param {boolean} isBoldTextLabel A value indicating whether the parameter title must be shown using bold font.
 @param {string} brText A string that should be used as line break symbol.
*/
function __createMarkupWithInformationAboutMailmarkCMDMBarcode(barcodeInfo, isBoldParameterTitle, brText) {
    var htmlMarkup = __createMarkupForBarcodeInfoParameter('UPU Country ID', barcodeInfo.decodedValue.upuCountryId, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Information type ID', barcodeInfo.decodedValue.informationTypeId, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Version ID', barcodeInfo.decodedValue.versionId, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Item class', barcodeInfo.decodedValue.itemClass, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Supply chain ID', barcodeInfo.decodedValue.supplyChainId, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Item ID', barcodeInfo.decodedValue.itemId, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('DPS', barcodeInfo.decodedValue.dps, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('RTS flag', barcodeInfo.decodedValue.rtsFlag, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Return to sender post code', barcodeInfo.decodedValue.returnToSenderPostCode, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Reserved', barcodeInfo.decodedValue.reserved, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Customer content', barcodeInfo.decodedValue.customerContent, isBoldParameterTitle, '');
    return htmlMarkup;
}

/**
 Creates a HTML markup with information about recognized PNP barcode.
 @param {object} barcodeInfo Information about barcode.
 @param {boolean} isBoldTextLabel A value indicating whether the parameter title must be shown using bold font.
 @param {string} brText A string that should be used as line break symbol.
*/
function __createMarkupWithInformationAboutPpnBarcode(barcodeInfo, isBoldParameterTitle, brText) {
    var htmlMarkup = __createMarkupForBarcodeInfoParameter('Batch number', barcodeInfo.decodedValue.batchNumber, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Date of manufacture', barcodeInfo.decodedValue.dateOfManufacture, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Expiry date', barcodeInfo.decodedValue.expiryDate, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('GTIN', barcodeInfo.decodedValue.GTIN, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Pharmacy product number', barcodeInfo.decodedValue.pharmacyProductNumber, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Serial number', barcodeInfo.decodedValue.serialNumber, isBoldParameterTitle, '');
    return htmlMarkup;
}

/**
 Creates a HTML markup with information about recognized AAMVA barcode.
 @param {object} barcodeInfo Information about barcode.
 @param {boolean} isBoldTextLabel A value indicating whether the parameter title must be shown using bold font.
 @param {string} brText A string that should be used as line break symbol.
*/
function __createMarkupWithInformationAboutAamvaBarcode(barcodeInfo, isBoldParameterTitle, brText) {
    var htmlMarkup = __createMarkupForBarcodeInfoParameter('Version level', barcodeInfo.versionLevel, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Issuer identification number', barcodeInfo.issuerIdentificationNumber, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Jurisdiction version number', barcodeInfo.jurisdictionVersionNumber, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('License number', barcodeInfo.licenseNumber, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Expiration date', barcodeInfo.expirationDate, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('IssueDate', barcodeInfo.issueDate, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Date of birth', barcodeInfo.dateOfBirth, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Card revision date', barcodeInfo.cardRevisionDate, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Family name', barcodeInfo.familyName, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('First name', barcodeInfo.firstName, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Middle name', barcodeInfo.middleName, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Sex', barcodeInfo.sex, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Height', barcodeInfo.height, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Eye color', barcodeInfo.eyeColor, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Hair color', barcodeInfo.hairColor, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Country ID', barcodeInfo.countryId, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Address street 1', barcodeInfo.addressStreet1, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Address street 2', barcodeInfo.addressStreet2, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Address city', barcodeInfo.addressCity, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Address state code', barcodeInfo.addressStateCode, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Address postal code', barcodeInfo.addressPostalCode, isBoldParameterTitle, '');
    return htmlMarkup;
}

/**
 Creates a HTML markup with information about recognized Swiss QR Code barcode.
 @param {object} barcodeInfo Information about barcode.
 @param {boolean} isBoldTextLabel A value indicating whether the parameter title must be shown using bold font.
 @param {string} brText A string that should be used as line break symbol.
*/
function __createMarkupWithInformationAboutSwissQrCodeBarcode(barcodeInfo, isBoldParameterTitle, brText) {
    var htmlMarkup = __createMarkupForBarcodeInfoParameter('QR type', barcodeInfo.decodedValue.qrType, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Version', barcodeInfo.decodedValue.version, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Coding type', barcodeInfo.decodedValue.codingType, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('IBAN', barcodeInfo.decodedValue.IBAN, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Creditor address type', barcodeInfo.decodedValue.creditorAddressType, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Creditor name', barcodeInfo.decodedValue.creditorName, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Creditor street or address line 1', barcodeInfo.decodedValue.creditorStreetOrAddressLine1, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Creditor building number or address line 2', barcodeInfo.decodedValue.creditorBuildingNumberOrAddressLine2, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Creditor postal code', barcodeInfo.decodedValue.creditorPostalCode, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Creditor town', barcodeInfo.decodedValue.creditorTown, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Creditor country', barcodeInfo.decodedValue.creditorCountry, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Ultimate creditor address type', barcodeInfo.decodedValue.ultimateCreditorAddressType, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Ultimate creditor name', barcodeInfo.decodedValue.ultimateCreditorName, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Ultimate creditor street or address line 1', barcodeInfo.decodedValue.ultimateCreditorStreetOrAddressLine1, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Ultimate creditor building number or address line 2', barcodeInfo.decodedValue.ultimateCreditorBuildingNumberOrAddressLine2, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Ultimate creditor postal code', barcodeInfo.decodedValue.ultimateCreditorPostalCode, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Ultimate creditor town', barcodeInfo.decodedValue.ultimateCreditorTown, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Ultimate creditor country', barcodeInfo.decodedValue.ultimateCreditorCountry, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Amount', barcodeInfo.decodedValue.amount, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Amount currency', barcodeInfo.decodedValue.amountCurrency, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Ultimate debtor address type', barcodeInfo.decodedValue.ultimateDebtorAddressType, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Ultimate debtor name', barcodeInfo.decodedValue.ultimateDebtorName, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Ultimate debtor street or address line 1', barcodeInfo.decodedValue.ultimateDebtorStreetOrAddressLine1, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Ultimate debtor building number or address line 2', barcodeInfo.decodedValue.ultimateDebtorBuildingNumberOrAddressLine2, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Ultimate debtor postal code', barcodeInfo.decodedValue.ultimateDebtorPostalCode, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Ultimate debtor town', barcodeInfo.decodedValue.ultimateDebtorTown, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Ultimate debtor country', barcodeInfo.decodedValue.ultimateDebtorCountry, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Payment reference type', barcodeInfo.decodedValue.paymentReferenceType, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Payment reference', barcodeInfo.decodedValue.paymentReference, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Unstructured message', barcodeInfo.decodedValue.unstructuredMessage, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Bill information', barcodeInfo.decodedValue.billInformation, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Alternative scheme parameters 1', barcodeInfo.decodedValue.alternativeSchemeParameters1, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('Alternative scheme parameters 2', barcodeInfo.decodedValue.alternativeSchemeParameters2, isBoldParameterTitle, '');
    return htmlMarkup;
}

/**
 Creates a HTML markup with information about recognized IATA BCBP barcode.
 @param {object} barcodeInfo Information about barcode.
 @param {boolean} isBoldTextLabel A value indicating whether the parameter title must be shown using bold font.
 @param {string} brText A string that should be used as line break symbol.
*/
function __createMarkupWithInformationAboutIataBcbpBarcode(barcodeInfo, isBoldParameterTitle, brText) {
    var htmlMarkup = __createMarkupForBarcodeInfoParameter('AirlineDesignatorOfIssuer', barcodeInfo.decodedValue.airlineDesignatorOfIssuer, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('AirlineNumericCode', barcodeInfo.decodedValue.airlineNumericCode, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('BaggageTagLicensePlate', barcodeInfo.decodedValue.baggageTagLicensePlate, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('CheckInSequenceNumber', barcodeInfo.decodedValue.checkInSequenceNumber, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('CompartmentCode', barcodeInfo.decodedValue.compartmentCode, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('ConditionalsSize', barcodeInfo.decodedValue.conditionalsSize, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('DateOfFlight', barcodeInfo.decodedValue.dateOfFlight, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('DateOfPassIssuance', barcodeInfo.decodedValue.dateOfPassIssuance, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('DocumentType', barcodeInfo.decodedValue.documentType, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('ElectronicTicketIndicator', barcodeInfo.decodedValue.electronicTicketIndicator, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('FirstBaggageTagLicensePlate', barcodeInfo.decodedValue.firstBaggageTagLicensePlate, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('FlightNumber', barcodeInfo.decodedValue.flightNumber, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('FormatCode', barcodeInfo.decodedValue.formatCode, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('FreeBaggageAllowance', barcodeInfo.decodedValue.freeBaggageAllowance, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('FrequentFlyerAirlineDesignator', barcodeInfo.decodedValue.frequentFlyerAirlineDesignator, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('FrequentFlyerNumber', barcodeInfo.decodedValue.frequentFlyerNumber, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('FromCityAirportCode', barcodeInfo.decodedValue.fromCityAirportCode, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('IdAdIndicator', barcodeInfo.decodedValue.idAdIndicator, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('InternationalDocumentVerification', barcodeInfo.decodedValue.internationalDocumentVerification, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('MarketingCarrierDesignator', barcodeInfo.decodedValue.marketingCarrierDesignator, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('NumberOfSegments', barcodeInfo.decodedValue.numberOfSegments, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('OperatingCarrierDesignator', barcodeInfo.decodedValue.operatingCarrierDesignator, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('OperatingCarrierPnrCode', barcodeInfo.decodedValue.operatingCarrierPnrCode, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('PassengerDescription', barcodeInfo.decodedValue.passengerDescription, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('PassengerName', barcodeInfo.decodedValue.passengerName, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('PassengerStatus', barcodeInfo.decodedValue.passengerStatus, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('RepeatedConditionalsSize', barcodeInfo.decodedValue.repeatedConditionalsSize, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('SeatNumber', barcodeInfo.decodedValue.seatNumber, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('SecondBaggageTagLicensePlate', barcodeInfo.decodedValue.secondBaggageTagLicensePlate, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('SelecteeIndicator', barcodeInfo.decodedValue.selecteeIndicator, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('SerialNumber', barcodeInfo.decodedValue.serialNumber, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('SourceOfBoardingPassIssuance', barcodeInfo.decodedValue.sourceOfBoardingPassIssuance, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('SourceOfCheckIn', barcodeInfo.decodedValue.sourceOfCheckIn, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('ToCityAirportCode', barcodeInfo.decodedValue.toCityAirportCode, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('UniqueConditionalsSize', barcodeInfo.decodedValue.uniqueConditionalsSize, isBoldParameterTitle, brText);
    htmlMarkup += __createMarkupForBarcodeInfoParameter('VersionNumber', barcodeInfo.decodedValue.versionNumber, isBoldParameterTitle, brText);
    return htmlMarkup;
}

/**
 Creates a HTML markup with information about recognized GS1 barcode.
 @param {object} barcodeInfo Information about barcode.
 @param {boolean} isBoldTextLabel A value indicating whether the parameter title must be shown using bold font.
 @param {string} brText A string that should be used as line break symbol.
*/
function __createMarkupWithInformationAboutGS1Barcode(barcodeInfo, isBoldParameterTitle, brText) {
    var htmlMarkup = "";
    if (barcodeInfo.applicationIdentifierValues != null) {
        for (var i = 0; i < barcodeInfo.applicationIdentifierValues.length; i++) {
            if (i == (barcodeInfo.applicationIdentifierValues.length - 1))
                brText = '';

            var applicationIdentifierValue = barcodeInfo.applicationIdentifierValues[i];
            htmlMarkup += __createMarkupForBarcodeInfoParameter(applicationIdentifierValue.applicationIdentifier.dataContent, applicationIdentifierValue.value, isBoldParameterTitle, brText);
        }
    }
    return htmlMarkup;
}

/**
 Creates a HTML markup with information about barcode info parameter.
 @param {string} barcodeInfoParamTitle Title of barcode info parameter.
 @param {string} barcodeInfoParamValue Value of barcode info parameter.
 @param {boolean} isBoldTextLabel A value indicating whether the parameter title must be shown using bold font.
 @param {string} brText A string that should be used as line break symbol.
*/
function __createMarkupForBarcodeInfoParameter(barcodeInfoParamTitle, barcodeInfoParamValue, isBoldParameterTitle, brText) {
    if (barcodeInfoParamValue == null)
        barcodeInfoParamValue = "";

    var labelStart = '', labelEnd = '';
    if (isBoldParameterTitle) {
        labelStart = '<b>';
        labelEnd = '</b>';
    }
    return labelStart + '- ' + barcodeInfoParamTitle + ': ' + labelEnd + barcodeInfoParamValue + brText;
}

/**
 Creates a HTML markup for additional barcode information.
 param {object} additionInfo Object that contains additional information about recognized barcode.
 returns {string} HTML markup.
*/
function __createMarkupForAdditionInfo(additionInfo) {
    var htmlMarkup = '';
    htmlMarkup += '<table style="text-align:center; width:100%">';
    htmlMarkup += '<tr style="background-color:#DBD7D7"><td><b>Name</b></td><td><b>Value</b></td></tr>';
    for (var name in additionInfo)
        htmlMarkup += '<tr><td style="background-color:#DBD7D7; text-align:left">' + name + '</td><td>' + additionInfo[name] + '</td></tr>';
    htmlMarkup += '</table>';
    return htmlMarkup;
}

/**
 Creates a HTML markup for ISO15416 barcode print quality test information.
 param {object} testInfo Information about quality test.
 returns {string} HTML markup.
*/
function __createMarkupForISO15416TestResult(testInfo) {
    var htmlMarkup = '';
    for (var i = 0; i < testInfo.length; i++) {
        if (testInfo.length > 1)
            htmlMarkup += '<br /><hr><b>Symbol component ' + (i + 1) + ':</b><br /><hr>';
        symbol = testInfo[i];
        htmlMarkup += '<table style="text-align:center; width:100%">';
        htmlMarkup += '<tr style="background-color:#DBD7D7"><td><b>Parameter</b></td><td><b>Value</b></td><td><b>Grade</b></td></tr>';
        if (symbol.decode != null)
            htmlMarkup += __createTableRowForQualityTestProperty("Decode", symbol.decode.value, symbol.decode.grade);
        htmlMarkup += __createTableRowForQualityTestProperty("MaxReflectance", symbol.maxReflectance.value, symbol.maxReflectance.grade);
        htmlMarkup += __createTableRowForQualityTestProperty("MinReflectance", symbol.minReflectance.value, symbol.minReflectance.grade);
        htmlMarkup += __createTableRowForQualityTestProperty("GlobalThreshold", symbol.globalThreshold.value, symbol.globalThreshold.grade);
        htmlMarkup += __createTableRowForQualityTestProperty("SymbolContrast", symbol.symbolContrast.value, symbol.symbolContrast.grade);
        if (symbol.minEdgeContrast != null)
            htmlMarkup += __createTableRowForQualityTestProperty("MinEdgeContrast", symbol.minEdgeContrast.value, symbol.minEdgeContrast.grade);
        if (symbol.modulation != null)
            htmlMarkup += __createTableRowForQualityTestProperty("Modulation", symbol.modulation.value, symbol.modulation.grade);
        if (symbol.defects != null)
            htmlMarkup += __createTableRowForQualityTestProperty("Defects", symbol.defects.value, symbol.defects.grade);
        if (symbol.decodability != null)
            htmlMarkup += __createTableRowForQualityTestProperty("Decodability", symbol.decodability.value, symbol.decodability.grade);
        if (symbol.printContrastSignal != null)
            htmlMarkup += __createTableRowForQualityTestProperty("PrintContrastSignal", symbol.printContrastSignal.value, symbol.printContrastSignal.grade);
        if (symbol.averageBarGain != null)
            htmlMarkup += __createTableRowForQualityTestProperty("AverageBarGain", symbol.averageBarGain.value, symbol.averageBarGain.grade);
        if (symbol.whiteNarrowBarWidth != null)
            htmlMarkup += __createTableRowForQualityTestProperty("WhiteNarrowBarWidth", symbol.whiteNarrowBarWidth.value, symbol.whiteNarrowBarWidth.grade);
        if (symbol.blackNarrowBarWidth != null)
            htmlMarkup += __createTableRowForQualityTestProperty("BlackNarrowBarWidth", symbol.blackNarrowBarWidth.value, symbol.blackNarrowBarWidth.grade);
        if (symbol.blackWhiteRatio != null)
            htmlMarkup += __createTableRowForQualityTestProperty("BlackWhiteRatio", symbol.blackWhiteRatio.value, symbol.blackWhiteRatio.grade);
        if (symbol.quietZoneLeft != null)
            htmlMarkup += __createTableRowForQualityTestProperty("QuietZoneLeft", symbol.quietZoneLeft.value, symbol.quietZoneLeft.grade);
        if (symbol.quietZoneRight != null)
            htmlMarkup += __createTableRowForQualityTestProperty("QuietZoneRight", symbol.quietZoneRight.value, symbol.quietZoneRight.grade);
        htmlMarkup += __createTableRowForQualityTestProperty("ScanGrade", symbol.scanGrade.value, symbol.scanGrade.grade);
        htmlMarkup += '</table>';
    }
    return htmlMarkup;
}

/**
 Creates a HTML markup for ISO15415 barcode print quality test information.
 param {object} testInfo Information about quality test.
 returns {string} HTML markup.
*/
function __createMarkupForISO15415TestResult(testInfo) {
    var htmlMarkup = '';
    htmlMarkup += '<table style="text-align:center; width:100%">';
    htmlMarkup += '<tr style="background-color:#DBD7D7"><td><b>Parameter</b></td><td><b>Value</b></td><td><b>Grade</b></td></tr>';
    htmlMarkup += __createTableRowForQualityTestProperty("Decode", testInfo.decode.value, testInfo.decode.grade);
    htmlMarkup += __createTableRowForQualityTestProperty("UnusedErrorCorrection", testInfo.unusedErrorCorrection.value, testInfo.unusedErrorCorrection.grade);
    if (testInfo.codewordYield != null)
        htmlMarkup += __createTableRowForQualityTestProperty("CodewordYield", testInfo.codewordYield.value, testInfo.codewordYield.grade);
    if (testInfo.codewordPrintQualityModulation != null)
        htmlMarkup += __createTableRowForQualityTestProperty("CodewordPrintQualityModulation", testInfo.codewordPrintQualityModulation.value, testInfo.codewordPrintQualityModulation.grade);
    if (testInfo.codewordPrintQualityDefects != null)
        htmlMarkup += __createTableRowForQualityTestProperty("CodewordPrintQualityDefects", testInfo.codewordPrintQualityDefects.value, testInfo.codewordPrintQualityDefects.grade);
    if (testInfo.codewordPrintQualityDecodability != null)
        htmlMarkup += __createTableRowForQualityTestProperty("CodewordPrintQualityDecodability", testInfo.codewordPrintQualityDecodability.value, testInfo.codewordPrintQualityDecodability.grade);
    if (testInfo.codewordPrintQuality != null)
        htmlMarkup += __createTableRowForQualityTestProperty("CodewordPrintQuality", testInfo.codewordPrintQuality.value, testInfo.codewordPrintQuality.grade);
    if (testInfo.maxReflectance != null)
        htmlMarkup += __createTableRowForQualityTestProperty("MaxReflectance", testInfo.maxReflectance.value, testInfo.maxReflectance.grade);
    if (testInfo.minReflectance != null)
        htmlMarkup += __createTableRowForQualityTestProperty("MinReflectance", testInfo.minReflectance.value, testInfo.minReflectance.grade);
    if (testInfo.symbolContrast != null)
        htmlMarkup += __createTableRowForQualityTestProperty("SymbolContrast", testInfo.symbolContrast.value, testInfo.symbolContrast.grade);
    if (testInfo.axialNonuniformity != null)
        htmlMarkup += __createTableRowForQualityTestProperty("AxialNonuniformity", testInfo.axialNonuniformity.value, testInfo.axialNonuniformity.grade);
    if (testInfo.gridNonuniformity != null)
        htmlMarkup += __createTableRowForQualityTestProperty("GridNonuniformity", testInfo.gridNonuniformity.value, testInfo.gridNonuniformity.grade);
    if (testInfo.modulation != null)
        htmlMarkup += __createTableRowForQualityTestProperty("Modulation", testInfo.modulation.value, testInfo.modulation.grade);
    if (testInfo.printGrowth != null)
        htmlMarkup += __createTableRowForQualityTestProperty("PrintGrowth", testInfo.printGrowth.value, testInfo.printGrowth.grade);
    if (testInfo.fixedPatternDamage != null)
        htmlMarkup += __createTableRowForQualityTestProperty("FixedPatternDamage", testInfo.fixedPatternDamage.value, testInfo.fixedPatternDamage.grade);
    if (testInfo.additionalGrades != null)
        for (var i = 0; i < testInfo.additionalGrades.length; i++)
            htmlMarkup += __createTableRowForQualityTestProperty(testInfo.additionalGrades[i].value, "", testInfo.additionalGrades[i].grade);
    if (testInfo.quietZone != null)
        htmlMarkup += __createTableRowForQualityTestProperty("QuietZone", testInfo.quietZone.value, testInfo.quietZone.grade);
    htmlMarkup += __createTableRowForQualityTestProperty("DistortionAngle", testInfo.distortionAngle.value, testInfo.distortionAngle.grade);
    htmlMarkup += __createTableRowForQualityTestProperty("OverallSymbolGrade", testInfo.overallSymbolGrade.value, testInfo.overallSymbolGrade.grade);
    htmlMarkup += '</table>';

    if (testInfo.startPattern != undefined) {
        htmlMarkup += '<hr><b>Start Pattern Test</b>:<br /><hr>';
        htmlMarkup += __createMarkupForISO15416TestResult([testInfo.startPattern]);
        htmlMarkup += '<hr>';
    }
    if (testInfo.centerPattern != undefined) {
        htmlMarkup += '<b>Center Pattern Test</b>:<br /><hr>';
        htmlMarkup += __createMarkupForISO15416TestResult([testInfo.centerPattern]);
        htmlMarkup += '<hr>';
    }
    if (testInfo.stopPattern != undefined) {
        htmlMarkup += '<b>Stop Pattern Test</b>:<br /><hr>';
        htmlMarkup += __createMarkupForISO15416TestResult([testInfo.stopPattern]);
        htmlMarkup += '<hr>';
    }

    return htmlMarkup;
}

/**
 Creates a markup for quality test property.
*/
function __createTableRowForQualityTestProperty(propertyName, value, grade) {
    var style = 'style="background-color:#DBD7D7; text-align:left"';
    return '<tr><td ' + style + '>' + propertyName + '</td><td>' + value + '</td><td>' + grade + '</td></tr>';
}

/**
 Replaces special HTML characters from the string with HTML code.
 param {string} sourceString Source string with HTML code.
 returns {string} String with replaces special HTML characters
*/
function __replaceSpecialHtmlChars(sourceString) {
    sourceString = sourceString.replace(/</g, '&lt;');
    sourceString = sourceString.replace(/>/g, '&gt;');
    return sourceString;
}



// ==============================================================================
// Utils
// ==============================================================================

/**
 Clears selections on image.
*/
function __clearSelections() {
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 Draws selection for the specified region.
*/
function __drawSelectionOnImage(region) {
    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.fillStyle = "rgba(0,233,0,0.5)";
    ctx.moveTo(region.rightTop.x, region.rightTop.y);
    ctx.lineTo(region.leftTop.x, region.leftTop.y);
    ctx.lineTo(region.leftBottom.x, region.leftBottom.y);
    ctx.lineTo(region.rightBottom.x, region.rightBottom.y);
    ctx.lineTo(region.rightTop.x, region.rightTop.y);
    ctx.fill();
}

/**
 Determines that point P belongs to a triangle ABC.
*/
function __isPointInTriangle(a, b, c, p) {
    var ab = (p.x - b.x) * (a.y - b.y) + (p.y - b.y) * (b.x - a.x);
    var bc = (p.x - c.x) * (b.y - c.y) + (p.y - c.y) * (c.x - b.x);
    var ca = (p.x - a.x) * (c.y - a.y) + (p.y - a.y) * (a.x - c.x);
    var EPS = 0.001;
    return (ab <= EPS && bc <= EPS && ca <= EPS) || (ab > -EPS && bc > -EPS && ca > -EPS);
}

/**
 Determines that point P belongs to a quadrangle ABCD.
*/
function __isPointInQuadrangle(A, B, C, D, P) {
    return __isPointInTriangle(D, A, B, P) || __isPointInTriangle(D, C, B, P);
}
