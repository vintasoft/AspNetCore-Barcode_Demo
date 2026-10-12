var hiddenSessionFieldElement = document.getElementById("hiddenSessionField");
var sessionId = hiddenSessionFieldElement.value;
Vintasoft.Shared.WebImagingEnviromentJS.set_SessionId(sessionId);

var __defaultInformationMessage =
    'Please do the following steps if you want to generate not GS1 barcode:\n\n' +
    '1. Click the "Barcode Writer Settings" button and specify necessary settings.\n\n' +
    '2. Click the "Write Barcode" button and new barcode image will be added to the image viewer.\n\n\n' +
    'Please do the following steps if you want to generate GS1 barcode:\n\n' +
    '1. Click the "GS1 Value Editor" button. Skip this step if you have GS1 value.\n' +
    '1.1. Create the GS1 value using dialog UI.\n' +
    '1.2. Copy the GS1 value to the clipboard.\n\n' +
    '2. Click the "Barcode Writer Settings" button and specify necessary settings. Set the GS1 value in "Value" field.\n\n' +
    '3. Click the "Write Barcode" button and new barcode image will be added to the image viewer.\n\n';
var barcodeWriteInformationTextBoxElement = document.getElementById("barcodeWriteInformationTextBox");
barcodeWriteInformationTextBoxElement.value = __defaultInformationMessage;

// barcode writer
var _barcodeWriter = new Vintasoft.Barcode.WebBarcodeWriterJS(_barcodeService);
// barcode writer settings
var _barcode1DWriterSettings = new Vintasoft.Barcode.Web1DBarcodeWriterSettingsJS();
_barcode1DWriterSettings.set_PixelFormat("Bgr24");
var _barcode2DWriterSettings = new Vintasoft.Barcode.Web2DBarcodeWriterSettingsJS();
_barcode2DWriterSettings.set_PixelFormat("Bgr24");

var _activeSettings = _barcode1DWriterSettings;

// default settings for dialog with barcode writer settings
var _dialogSettings = {
    title: 'Barcode Writer Settings',
    width: 580,
    height: 580,
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

// PropertyGridControl settings
var _propertyControlSettings = {
    hideNestedElements: false,
    showReadOnlyElements: false
};

// create WebPropertyGridJS object for _barcode1DWriterSettings
var propertyGrid = new Vintasoft.Shared.WebPropertyGridJS(_barcode1DWriterSettings);
// create PropertyGridControlJS
var _barcode1DSettingsControl = new PropertyGridControlJS(propertyGrid, "Barcode1DSettingsPropGrid", _propertyControlSettings);
// create markup
_barcode1DSettingsControl.createMarkup();

propertyGrid = new Vintasoft.Shared.WebPropertyGridJS(_barcode2DWriterSettings);
var _barcode2DSettingsControl = new PropertyGridControlJS(propertyGrid, "Barcode2DSettingsPropGrid", _propertyControlSettings);
_barcode2DSettingsControl.createMarkup();


var writeBarcodeButton = document.getElementById("WriteBarcodeButton");
writeBarcodeButton.addEventListener("click", __sendWriteBarcodeRequest);

var barcodeWriterSettingsButton = document.getElementById("BarcodeWriterSettingsButton");
barcodeWriterSettingsButton.addEventListener("click", __showBarcodeWriterSettings);

var gs1ValueEditorButton = document.getElementById("Gs1ValueEditorButton");
gs1ValueEditorButton.addEventListener("click", __showGs1ValueEditorDialog);

var barcodeDimensionSelectElement = document.getElementById("barcodeDimensionSelect");
barcodeDimensionSelectElement.addEventListener("change", __barcodeDimensionChanged);

var barcodeImageElement = document.getElementById("barcodeImage");
barcodeImageElement.addEventListener("load", __barcodeImageLoaded);


/**
 Shows a dialog with barcode writer settings.
*/
function __showBarcodeWriterSettings() {
    // change visibility of PropertyGridControlJS
    __barcodeDimensionChanged();
    $("#barcodeWriterSettingDialog").dialog(_dialogSettings);
}

/**
 Shows a dialog that allows to edit the GS1 value.
*/
function __showGs1ValueEditorDialog() {
    new Gs1ValueEditorDialogJS();
}

/**
 Sends an asynchronous request for writing barcode.
*/
function __sendWriteBarcodeRequest() {
    // Barcode is generated successfully.
    function __writeBarcode_success(data) {
        var imageAsBase64string = data.barcodeImage;
        document.getElementById("barcodeImage").src = imageAsBase64string
    }

    // Barcode generation error occurs.
    function __writeBarcode_failed(data) {
        if (data.errorMessage)
            alert(data.errorMessage);
        else
            // show information about error
            alert(data.responseJSON.ExceptionMessage);
    }

    // specify the barcode writer settings
    _barcodeWriter.set_Settings(_activeSettings);
    // get barcode image as Base64 string
    _barcodeWriter.getBarcodeAsBase64Image(__writeBarcode_success, __writeBarcode_failed);
}

/**
 Barcode dimension (1D or 2D) is changed.
*/
function __barcodeDimensionChanged() {
    var barcodeDimensionSelectElement = document.getElementById("barcodeDimensionSelect");
    var currentDimension = barcodeDimensionSelectElement.value;
    var activeDivID, nonActiveDivID;
    // active 1D settings
    if (currentDimension === "1D") {
        _activeSettings = _barcode1DWriterSettings;
        // get ID of active placeholder
        activeDivID = _barcode1DSettingsControl.get_PlaceHolderID();
        // get ID of none active placeholder
        nonActiveDivID = _barcode2DSettingsControl.get_PlaceHolderID();
    }
    else {
        _activeSettings = _barcode2DWriterSettings;
        activeDivID = _barcode2DSettingsControl.get_PlaceHolderID();
        nonActiveDivID = _barcode1DSettingsControl.get_PlaceHolderID();
    }
    // make active div visible
    var activeDivIDElement = document.getElementById(activeDivID);
    activeDivIDElement.style.display = "block";
    // make other invisible
    var nonActiveDivIDElement = document.getElementById(nonActiveDivID);
    nonActiveDivIDElement.style.display = "none";
}

/**
 Barcode image is loaded.
*/
function __barcodeImageLoaded(event) {
    // get real image height
    var height = this.height;
    // calculate top margin
    var topMargin = 0;
    if (height < 600)
        topMargin = (600 - height) / 2;
    // set image margin
    event.target.style.marginTop = topMargin + "px";
}
