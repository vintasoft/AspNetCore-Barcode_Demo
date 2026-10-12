/**
 Manager of video devices.
*/
VideoInputDeviceManagerJS = function () {

    /**
     Gets the video devices.
    */
    VideoInputDeviceManagerJS.prototype.get_Devices = function () {
        return this._devices;
    }



    /**
     Refreshes the devices. Later devices can be accessed using the get_Devices function.
    */
    VideoInputDeviceManagerJS.prototype.refreshDevices = function (success, error) {
        var that = this;

        function __getUserMedia_success(stream) {
            // enumerate media devices
            var promise = navigator.mediaDevices.enumerateDevices();
            promise.then(__enumerateDevices_success).catch(error);
        }

        function __enumerateDevices_success(mediaDevices) {
            // get available video devices from available media devices
            var currentVideoDevices = __getVideoDevicesFromMediaDevices(mediaDevices);
            // get the previous list with video devices
            var previousVideoDevices = that.get_Devices();

            var i = 0;
            // for each video device in previous list
            while (i < previousVideoDevices.length) {
                // get video device from previous list
                var previousDevice = previousVideoDevices[i];
                var j = 0;
                // determines that device presents in previous and current list
                var isDevicePresentInPreviousAndCurrentList = false;
                // for each video device in current list
                while (j < currentVideoDevices.length) {
                    // get video device in current list
                    var currentDevice = currentVideoDevices[j];
                    // if device in previous list and device in current list have the same device identifier
                    if (currentDevice.get_Id() === previousDevice.get_Id()) {
                        // remove device from the current list
                        currentVideoDevices.splice(j, 1);
                        // specify that device presents in previous and current list
                        isDevicePresentInPreviousAndCurrentList = true;
                        // break the loop
                        break;
                    }
                    else
                        j++;
                }
                // if device presents in previous and current list
                if (isDevicePresentInPreviousAndCurrentList)
                    // go to the next device
                    i++;
                    // if device presents in previous list but not presents in current list
                else {
                    // close the device
                    previousDevice.close();
                    // remove the device from the previous list
                    previousVideoDevices.splice(i, 1);
                }
            }

            // for each device in current list (current list now contains only newly connected devices)
            for (i = 0; i < currentVideoDevices.length; i++)
                // add newly connected devices to the device list
                that._devices.push(currentVideoDevices[i]);

            if (success != null)
                success(that);
        }

        // try get access to video devices
        var promise = navigator.mediaDevices.getUserMedia({ video: true });
        promise.then(__getUserMedia_success).catch(error);
    }

    /**
     Finds a video device with the specified ID.
    */
    VideoInputDeviceManagerJS.prototype.findDeviceById = function (deviceId) {
        for (var i = 0; i < this._devices.length; i++) {
            if (this._devices[i].get_Id() == deviceId)
                return this._devices[i];
        }
        return null;
    }


    /**
     Returns available video devices from available media devices.
    */
    function __getVideoDevicesFromMediaDevices(mediaDevices) {
        var videoDevices = []
        // for each device info
        for (var i = 0; i < mediaDevices.length; i++) {
            // current device info
            var deviceInfo = mediaDevices[i];
            // if device type is videoinput
            if (deviceInfo.kind === 'videoinput') {
                // get device name
                var deviceName = deviceInfo.label || 'camera #' + (videoDevices.length + 1);
                // create the VideoInputDeviceJS object
                var videoDevice = new VideoInputDeviceJS(deviceInfo.deviceId, deviceName);
                // save information about device
                videoDevices.push(videoDevice);
            }
        }
        return videoDevices;
    }



    this._devices = [];

};

/**
 Video device.
*/
VideoInputDeviceJS = function (id, name) {

    /**
     Gets the device name.
    */
    VideoInputDeviceJS.prototype.get_Name = function () {
        return this._name;
    }

    /**
     Gets the device ID.
    */
    VideoInputDeviceJS.prototype.get_Id = function () {
        return this._id;
    }



    /**
     Starts playing video.
    */
    VideoInputDeviceJS.prototype.play = function () {
        if (this._videoElement != null) {
            this._videoElement.play();
        }
    }

    /**
     Stops playing video.
    */
    VideoInputDeviceJS.prototype.pause = function () {
        if (this._videoElement != null) {
            this._videoElement.pause();
        }
    }

    /**
     Activates the media stream of device.
    */
    VideoInputDeviceJS.prototype.activate = function (videoElement, success, error) {
        // create media stream constraints
        var constraints = { video: { deviceId: this._id ? { exact: this._id } : null } };
        var that = this;
        // try get media stream
        var promise = navigator.mediaDevices.getUserMedia(constraints);
        // if the media stream is received
        promise.then(function (stream) {
            // save reference to the media stream
            that._stream = stream;
            // save reference to the video element
            that._videoElement = videoElement;

            // get video track
            var videoTrack = stream.getVideoTracks()[0];
            // get settings of video track
            var settings = videoTrack.getSettings();

            // change size of video element
            that._videoElement.width = settings.width;
            that._videoElement.height = settings.height;

            $(that._videoElement).off();
            $(that._videoElement).one("loadedmetadata", function (event) {
                // if success callback is defined
                if (success != null)
                    // call the success callback
                    success();
            });

            // older browsers may not have srcObject
            if ("srcObject" in that._videoElement)
                that._videoElement.srcObject = stream;
            else
                that._videoElement.src = window.URL.createObjectURL(stream);

        }).catch(error);
    }

    /**
     Returns a value indicating whether the device is activated.
    */
    VideoInputDeviceJS.prototype.isActived = function () {
        if (this._stream != null)
            return this._stream.activate;
        return false;
    }

    /**
     Deactivates the media stream of device.
    */
    VideoInputDeviceJS.prototype.deactivate = function () {
        this.pause();
        // if media stream exists
        if (this._stream) {
            // get all tracks
            var tracks = this._stream.getTracks();
            // stop each track
            for (var i = 0; i < tracks.length; i++)
                tracks[i].stop();
            this._stream = null;
        }
        // if video element exists
        if (this._videoElement) {
            // clear information about srcObject
            this._videoElement.srcObject = null;
            // clear information about video element
            this._videoElement = null;
        }
    }

    /**
     Closes video device.
    */
    VideoInputDeviceJS.prototype.close = function () {
        $(this).triggerHandler("closed");
    }

    /**
     Captures video frame.
    */
    VideoInputDeviceJS.prototype.captureFrameAsBase64String = function (canvas) {
        // check that we have active video element
        if (this._videoElement == null)
            throw new Error("Device is not active.");
        // get canvas
        if (canvas == null)
            canvas = document.createElement("canvas");
        canvas.width = this._videoElement.width;
        canvas.height = this._videoElement.height;
        // get context
        var context = canvas.getContext("2d");
        // draw video frame
        context.drawImage(this._videoElement, 0, 0, this._videoElement.width, this._videoElement.height);
        // get canvas as base 64 data
        return canvas.toDataURL('image/png');
    }


    this._id = id;
    this._name = name;
    this._stream = null;
    this._videoElement = null;
}