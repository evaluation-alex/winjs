﻿// Copyright (c) Microsoft Open Technologies, Inc.  All Rights Reserved. Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
// Note: We should not call the API directly from mediaElement object.We should always call those API (like play, pause etc) from mediaElementAdapter. Otherwise functionality might breaks
// if someone implemented custom mediaElementAdapters.
// Media Player
define('WinJS/Controls/MediaPlayer', [
    'exports',
    '../Core/_Global',
    '../Core/_WinRT',
    '../Core/_Base',
    '../Core/_BaseUtils',
    '../Core/_Events',
    '../Core/_ErrorFromName',
    '../Res',
    '../Core/_Resources',
    '../Core/_WriteProfilerMark',
    '../Promise',
    '../_Signal',
    '../Scheduler',
    '../Application',
    '../BindingList',
    '../_Accents',
    '../Animations',
    '../Animations/_TransitionAnimation',
    '../Navigation',
    '../Utilities/_Dispose',
    '../Utilities/_Control',
    '../ControlProcessor',
    '../Controls/AppBar/_Command',
    '../Controls/AppBar/_Icon',
    '../Controls/MediaPlayer/MediaElementAdapter',
    '../Controls/BackButton',
    "../Controls/Flyout",
    '../Controls/ToolBar/_ToolBar',
    '../Utilities/_ElementUtilities',
    '../Controls/MediaPlayer/_MediaUI',
    // Put references to styles in src/mediaPlayerCss.js
], function mediaPlayerInit(exports, _Global, _WinRT, _Base, _BaseUtils, _Events, _ErrorFromName, _Res, _Resources, _WriteProfilerMark, Promise, _Signal, Scheduler, Application, BindingList, _Accents, Animations, _TransitionAnimation, Navigation, _Dispose, _Control, _ControlProcessor, _Command, _Icon, MediaElementAdapter, BackButton, _Flyout, _ToolBar, _ElementUtilities, _MediaUI) {
    "use strict";

    _Accents.createAccentRule(".win-mediaplayer-seekprogress, .win-mediaplayer-scrubbing .win-mediaplayer-seek-mark", [{ name: "background-color", value: _Accents.ColorTypes.accent }]);
    _Accents.createAccentRule(".win-mediaplayer-seek-mark, html.win-hoverable .win-mediaplayer-scrubbing .win-mediaplayer-seek-mark:hover", [{ name: "border-color", value: _Accents.ColorTypes.accent }]);

    var nav = Navigation;
    var utilities = _ElementUtilities;
    var mediaCommandEnum = _MediaUI.MediaCommand;
    var markerType = _MediaUI.MarkerType;

    _Base.Namespace.define("WinJS.UI", {

        // MediaPlayer is capitalized to follow WinJS conventions for class names.
        MediaPlayer: _Base.Namespace._lazy(function () {
            var SmartGlass = null;
            if (_WinRT.Windows.Xbox &&
                _WinRT.Windows.Xbox.SmartGlass) {
                SmartGlass = _WinRT.Windows.Xbox.SmartGlass;
            }

            var strings = {
                get chapterSkipBackMediaCommandDisplayText() { return _Resources._getWinJSString("ui/chapterSkipBackMediaCommandDisplayText").value; },
                get chapterSkipForwardMediaCommandDisplayText() { return _Resources._getWinJSString("ui/chapterSkipForwardMediaCommandDisplayText").value; },
                get closedCaptionsLabelNone() { return _Resources._getWinJSString("ui/closedCaptionsLabelNone").value; },
                get closedCaptionsMediaCommandDisplayText() { return _Resources._getWinJSString("ui/closedCaptionsMediaCommandDisplayText").value; },
                get fastForwardMediaCommandDisplayText() { return _Resources._getWinJSString("ui/fastForwardMediaCommandDisplayText").value; },
                get fastForwardFeedbackDisplayText() { return _Resources._getWinJSString("ui/fastForwardFeedbackDisplayText").value; },
                get fastForwardFeedbackSlowMotionDisplayText() { return _Resources._getWinJSString("ui/fastForwardFeedbackSlowMotionDisplayText").value; },
                get goToLiveMediaCommandDisplayText() { return _Resources._getWinJSString("ui/goToLiveMediaCommandDisplayText").value; },
                get mediaErrorAborted() { return _Resources._getWinJSString("ui/mediaErrorAborted").value; },
                get mediaErrorNetwork() { return _Resources._getWinJSString("ui/mediaErrorNetwork").value; },
                get mediaErrorDecode() { return _Resources._getWinJSString("ui/mediaErrorDecode").value; },
                get mediaErrorSourceNotSupported() { return _Resources._getWinJSString("ui/mediaErrorSourceNotSupported").value; },
                get mediaErrorUnknown() { return _Resources._getWinJSString("ui/mediaErrorUnknown").value; },
                get mediaPlayerAddMarkerErrorInvalidMarkerType() { return "Invalid argument: The type used is not supported."; },
                get mediaPlayerOverlayActiveOptionIndicator() { return _Resources._getWinJSString("ui/mediaPlayerOverlayActiveOptionIndicator").value; },
                get mediaPlayerLayvolumeoutUnsupportedValue() { return "Invalid argument: The value for XboxJS.UI.MediaPlayer.layout is not supported."; },
                get mediaPlayerInvalidTimeValue() { return "Invalid argument: Time must be a number."; },
                get mediaPlayerNullContentType() { return "Invalid argument: contentType cannot be null."; },
                get unSupportedOperation() { return "UnSupported Operation: Cannot possible set the compact after setting Commands property"; },
                get mediaPlayerNullMetadata() { return "Invalid argument: metadata cannot be null."; },
                get mediaPlayerSetContentMetadataInvalidContentRating() { return "Invalid argument: contentRating is empty or incorrectly formatted."; },
                get nextTrackMediaCommandDisplayText() { return _Resources._getWinJSString("ui/nextTrackMediaCommandDisplayText").value; },
                get playbackRateHalfSpeedLabel() { return _Resources._getWinJSString("ui/playbackRateHalfSpeedLabel").value; },
                get playbackRateNormalSpeedLabel() { return _Resources._getWinJSString("ui/playbackRateNormalSpeedLabel").value; },
                get playbackRateOneAndHalfSpeedLabel() { return _Resources._getWinJSString("ui/playbackRateOneAndHalfSpeedLabel").value; },
                get playbackRateDoubleSpeedLabel() { return _Resources._getWinJSString("ui/playbackRateDoubleSpeedLabel").value; },
                get playMediaCommandDisplayText() { return _Resources._getWinJSString("ui/playMediaCommandDisplayText").value; },
                get playFromBeginningMediaCommandDisplayText() { return _Resources._getWinJSString("ui/playMediaCommandDisplayText").value; },
                get pauseMediaCommandDisplayText() { return _Resources._getWinJSString("ui/pauseMediaCommandDisplayText").value; },
                get previousTrackMediaCommandDisplayText() { return _Resources._getWinJSString("ui/playFromBeginningMediaCommandDisplayText").value; },
                get replayMediaCommandDisplayText() { return _Resources._getWinJSString("ui/replayMediaCommandDisplayText").value; },
                get rewindMediaCommandDisplayText() { return _Resources._getWinJSString("ui/rewindMediaCommandDisplayText").value; },
                get rewindFeedbackDisplayText() { return _Resources._getWinJSString("ui/rewindFeedbackDisplayText").value; },
                get rewindFeedbackSlowMotionDisplayText() { return _Resources._getWinJSString("ui/rewindFeedbackSlowMotionDisplayText").value; },
                get stopMediaCommandDisplayText() { return _Resources._getWinJSString("ui/stopMediaCommandDisplayText").value; },
                get timeSeparator() { return _Resources._getWinJSString("ui/timeSeparator").value; },
                get timeSkipBackMediaCommandDisplayText() { return _Resources._getWinJSString("ui/timeSkipBackMediaCommandDisplayText").value; },
                get timeSkipForwardMediaCommandDisplayText() { return _Resources._getWinJSString("ui/timeSkipForwardMediaCommandDisplayText").value; },
                get mediaPlayerAudioTracksButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerAudioTracksButtonLabel").value; },
                get mediaPlayerStopButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerStopButtonLabel").value; },
                get mediaPlayerPreviousTrackButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerPreviousTrackButtonLabel").value; },
                get mediaPlayerPlayFromBeginningButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerPlayFromBeginningButtonLabel").value; },
                get mediaPlayerChapterSkipBackButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerChapterSkipBackButtonLabel").value; },
                get mediaPlayerRewindButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerRewindButtonLabel").value; },
                get mediaPlayerTimeSkipBackButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerTimeSkipBackButtonLabel").value; },
                get mediaPlayerPlayButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerPlayButtonLabel").value; },
                get mediaPlayerPlayRateButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerPlayRateButtonLabel").value; },
                get mediaPlayerTimeSkipForwardButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerTimeSkipForwardButtonLabel").value; },
                get mediaPlayerFastForwardButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerFastForwardButtonLabel").value; },
                get mediaPlayerChapterSkipForwardButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerChapterSkipForwardButtonLabel").value; },
                get mediaPlayerNextTrackButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerNextTrackButtonLabel").value; },
                get mediaPlayerClosedCaptionsButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerClosedCaptionsButtonLabel").value; },
                get mediaPlayerZoomButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerZoomButtonLabel").value; },
                get mediaPlayerLiveButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerLiveButtonLabel").value; },
                get mediaPlayerToggleSnapButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerToggleSnapButtonLabel").value; },
                get mediaPlayerCastButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerCastButtonLabel").value; },
                get mediaPlayerVolumeButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerVolumeButtonLabel").value; },
                get mediaPlayerFullscreenButtonLabel() { return _Resources._getWinJSString("ui/mediaPlayerFullscreenButtonLabel").value; }
            };

            // If we are running in an iFrame, then wuiv should be undefined. Otherwise there will be an exception.
            var wuiv = _WinRT.Windows.UI.ViewManagement;

            var MediaPlayer = _Base.Class.define(function (element, options) {
                /// <signature helpKeyword="WinJS.UI.MediaPlayer.MediaPlayer">
                /// <summary locid="WinJS.UI.MediaPlayer.constructor">
                /// Creates a new MediaPlayer.
                /// </summary>
                /// <param name="element" domElement="true" locid="WinJS.UI.MediaPlayer.constructor_p:element">
                /// The DOM element that hosts the MediaPlayer control.
                /// </param>
                /// <param name="options" type="Object" locid="WinJS.UI.MediaPlayer.constructor_p:options">
                /// An object that contains one or more property/value pairs to apply to the new control.
                /// Each property of the options object corresponds to one of the control's properties or events.
                /// </param>
                /// <returns type="WinJS.UI.MediaPlayer" locid="WinJS.UI.MediaPlayer.constructor_returnValue">
                /// The new MediaPlayer.
                /// </returns>
                /// </signature>

                _WriteProfilerMark("WinJS.UI.MediaPlayer:constructor,StartTM");

                element = element || _Global.document.createElement("div");
                element.winControl = this;

                utilities.addClass(element, "win-disposable");
                utilities.addClass(element, "win-mediaplayer");
                utilities.addClass(element, "win-mediaplayer-doublerow");

                // Private fields.
                this._adjustedContentType = null;
                this._audioTracksButton = null;
                this._areControlsHiding = false;
                this._backButton = null;
                this._busyIndicator = null;
                this._buttonEventSubscriptions = [];
                this._castButton = null;
                this._chapterSkipBackButton = null;
                this._chapterSkipForwardButton = null;
                this._closedCaptionsButton = null;
                this._element = element;
                if (_WinRT.Windows.Media.ContentRestrictions.RatedContentRestrictions) {
                    this._contentRestrictions = new _WinRT.Windows.Media.ContentRestrictions.RatedContentRestrictions();
                }
                this._checkParentalControlsBind = this._checkParentalControls.bind(this);
                this._checkParentalControlsAvailableBind = this._checkParentalControlsAvailable.bind(this);
                this._controlHideTimeout = null;
                this._controls = null;
                this._controlsKeyupInputHandler = null;
                this._currentTimeIndicator = null;
                this._currentTimeVisualElements = null;
                this._currentScrubbingVelocity = 0;
                this._defaultChapterMarkers = [];
                this._disposed = false;
                // The following 3 does*NeedResetting variables are used to keep track of whether or not we to re-initialize endTime, startTime, and
                // the custom markers array to default values. They are initialized to 'true' because when the control is first instantiated, we need 
                // to set default values for these properties.
                this._doesEndTimeNeedResetting = true;
                this._doesStartTimeNeedResetting = true;
                this._doMarkersNeedResetting = true;
                this._endTime = 0;
                // We need to keep track of whether the endTime was reached so we can set button state appropriately
                this._endTimeReached = false;
                this._errorFlyout = null;
                this._audioTracksFlyout = null;
                this._closedCaptionsFlyout = null;
                this._errorText = null;
                this._fastForwardButton = null;
                this._fastForwardOrRewindTimer = null;
                this._fastForwardOrRewindTimerElapsedTime = 0;
                this._gestureEventSubscriptions = [];
                this._gestureRecognizer = null;
                if (_WinRT.Windows.UI.Input.GestureRecognizer) {
                    this._gestureRecognizer = new _WinRT.Windows.UI.Input.GestureRecognizer();
                    this._gestureRecognizer.gestureSettings =
                        _WinRT.Windows.UI.Input.GestureSettings.manipulationTranslateX |
                        _WinRT.Windows.UI.Input.GestureSettings.manipulationTranslateY;
                }
                this._goToLiveButton = null;
                this._handleFlyoutOpenCallbackBind = null;
                this._handleFlyoutCloseCallbackBind = null;
                this._handleSeekedAfterExitFastForwardOrRewindBind = null;
                this._handleSystemTransportControlsButtonPressedBind = null;
                this._handleloadTextTrackCallbackBind = null;
                this._handleTransportBarButtonFocus = null;
                this._handleVoiceEngagedBind = null;
                this._handleVoiceDisengagedBind = null;
                // We need this extra variable to keep track of when the 1st custom marker is added and the last custom marker is
                // removed. If we didn't care about when the 1st custom marker was added (as opposed to the 2nd), we could just check
                // to see if: this._markers.length > 0;
                this._hasCustomMarkers = false;
                this._inputHandlerClickCallback = null;
                this._inputHandlerPointerDownCallback, null,
                this._inputHandlerPointerMoveCallback = null,
                this._inputHandlerPointerUpCallback = null,
                this._inputHandlerElement = null;
                this._isBusyInternal = false;
                this._isChapterMarkerVisualsDirty = false;
                this._compact = false;
                this._controlsVisible = false;
                this._isInFastForwardOrRewindMode = false;
                this._isFlyoutOpen = false;
                this._fullScreen = false;
                this._handleTimelineArrowKeyDownBind = this._handleTimelineArrowKeyDown.bind(this);
                this._isHandAtLeftEdge = false;
                this._isHandAtRightEdge = false;
                this._isPointerDown = false;
                this._simulatedFastForwardMode = true;
                this._isThumbGrabbed = false;
                this._keydownInputHandler = null;
                this._keyupInputHandler = null;
                this._fullScreenChangeHandler = null;
                this._fullScreenErrorHandler = null;
                this._lastControlsResetTimeStamp = null;
                this._lastFastForwardOrRewindTimerTime = 0;
                this._lastPointerPosition = "0,0";
                this._lastPosition = 0;
                this._markers = [];
                this._mediaCommandFeedbackText = null;
                this._mediaElementAdapter = null;
                this._mediaEventSubscriptions = [];
                this._mediaMetadata = null;
                this._mediaState = {};
                this._metadataTitle = null;
                this._metadataDescription = null;
                this._muteButton = null;
                // This private field tracks the next marker time as an optimization so we don't have to iterate
                // through the entire marker collection when trying to determine which one is next. 
                // We initialize the next two values to '-1' rather than zero; because otherwise a 'markerreached'
                // event will always fire at time zero.
                this._nextCustomMarkerIndex = -1;
                this._nextCustomMarkerTime = -1;
                this._nextTrackButton = null;
                this._onHideControlsCommandInvokedBind = null;
                this._onShowControlsCommandInvokedBind = null;
                this._playbackSpeedIndicator = null;
                this._playbackRateButton = null;
                this._playbackRateFlyout = null;
                this._playPauseButton = null;
                this._playFromBeginningButton = null;
                this._previousPlaybackRate = 0;
                this._previousCustomMarkerIndex = -1;
                this._previousCustomMarkerTime = -1;
                this._previousTrackButton = null;
                this._previousVolumeValue = 0;
                this._progress = null;
                this._progressContainer = null;
                this._updateMediaStateBind = null;
                this._relativeTimelineStartOffset = 0;
                this._rewindButton = null;
                this._seekBar = null;
                this._seekMark = null;
                this._seekTimeIndicator = null;
                this._seekWindowLeftEdgeElement = null;
                this._seekWindowRightEdgeElement = null;
                this._startOffsetX = 0;
                this._startTime = 0;
                this._stopButton = null;
                this._smtControls = null;
                if (_WinRT.Windows.Media.SystemMediaTransportControls) {
                    this._smtControls = _WinRT.Windows.Media.SystemMediaTransportControls.getForCurrentView();
                }
                this._targetPlaybackRate = 0;
                this._targetCurrentTime = 0;
                this._minimumSeekableRangeInPixels = 0;
                this._thumbElement = null;
                this._thumbElementWidthDividedByTwo = 0;
                this._thumbnailEnabled = true;
                this._thumbnailImage = null;
                this._thumbnailImageVisual = null;
                this._thumbImageElementWidthDividedByTwo = 0;
                this._toggleFullScreenButton = null;
                this._timeline = null;
                // This time is in milliseconds. The recommended time for showing
                // progress is for operations that are two seconds or greater. By waiting
                // one second, we can avoid the flicker.
                this._timeBeforeShowingBusyVisual = 1000;
                this._timeFormatter = this._defaultTimeFormatter;
                this._timeRemainingIndicator = null;
                this._timeSeparator = strings.timeSeparator;
                this._timeSkipBackButton = null;
                this._timeSkipForwardButton = null;
                this._toolbar = null;
                this._toolbarElement = null;
                this._totalSeekBarWidth = 0;
                this._totalTimeInternal = 0;
                this._totalTimeIndicator = null;
                this._transportControls = null;
                this._updateAudioTracksButtonStateBind = this._updateAudioTracksButtonState.bind(this);
                this._updateClosedCaptionsButtonStateBind = this._updateClosedCaptionsButtonState.bind(this);
                this._volumeButton = null;
                this._volumeFlyout = null;
                this._volumeSlider = null;
                this._volumeValue = null;
                this._wasStartTimeSetProgrammatically = false;
                this._wasEndTimeSetProgrammatically = false;
                this._wasDragAndNotClick = false;
                this._wasPausedBeforeScrubbing = false;
                this._wasPlayingBeforeSuspend = false;
                // This variable keeps track of whether the time was clamped to the end time. There are cases where we need the
                // current time can go past the end time. If we perform more than one seek in this state, it is possible to trigger
                // a condition in Media Foundation that results in the ended event not being fired. To work around the issue, we
                // keep track of whether we've already clamped the end time once so that we don't do it more than once and trigger
                // the undesirable condition.
                this._wasTimeClampedToEndTime = false;
                this._windowResizeCallback = null;
                this._toolbarResizeCallback = null;
                this._zoomButton = null;

                // Is*Visible properties
                this._chapterSkipBackButtonVisible = false;
                this._chapterSkipForwardButtonVisible = false;
                this._fastForwardButtonVisible = false;
                this._nextTrackButtonVisible = false;
                this._playFromBeginningButtonVisible = false;
                this._playPauseButtonVisible = true;
                this._playbackRateButtonVisible = false;
                this._previousTrackButtonVisible = false;
                this._rewindButtonVisible = false;
                this._stopButtonVisible = false;
                this._timeSkipBackButtonVisible = false;
                this._timeSkipForwardButtonVisible = false;
                this._zoomButtonVisible = true;
                this._goToLiveButtonVisible = false;
                this._fullScreenButtonVisible = true;
                this._castButtonVisible = true;
                this._playbackRateButtonVisible = false;
                this._muteButtonVisible = false;
                this._volumeButtonVisible = true;
                this._seekBarVisible = true;

                // Is*Enabled properties
                this._chapterSkipBackButtonEnabled = true;
                this._chapterSkipForwardButtonEnabled = true;
                this._fastForwardButtonEnabled = true;
                this._nextTrackButtonEnabled = true;
                this._playFromBeginningButtonEnabled = true;
                this._playPauseButtonEnabled = true;
                this._previousTrackButtonEnabled = true;
                this._rewindButtonEnabled = true;
                this._stopButtonEnabled = true;
                this._timeSkipBackButtonEnabled = true;
                this._timeSkipForwardButtonEnabled = true;
                this._zoomButtonEnabled = true;
                this._goToLiveButtonEnabled = true;
                this._castButtonEnabled = true;
                this._fullScreenButtonEnabled = true;
                this._playbackRateButtonEnabled = true;
                this._volumeButtonEnabled = true;
                this._muteButtonEnabled = true;
                this._seekingEnabled = true;

                this._isToolbarResized = false;
                this._originalParent = null;
                this._nextSibiling = null;

                // Test hooks
                this._isTestMode = false;
                // This property tells the MediaPlayer control to skip animations so that tests can run faster
                this._skipAnimations = false;

                // Constants
                // This value is used to determine whether the current time is close enough to the nearest marker
                // that is can be considered at the marker for chapter skipping purposes. See the chapterSkipForward
                // or chapterSkipBack functions for more detail. The value is in seconds.
                this._CHAPTER_SKIP_THRESHOLD = 1;
                this._CONTROLS_AUTO_HIDE_DURATION = 3000;
                // How often the function to update the time display during a fast forward or rewind is called.
                this._FAST_FORWARD_OR_REWIND_TIMER_INTERVAL = 250;
                this._MARKER_PROXIMITY_THRESHOLD = 0.5;
                // We won't add chapter markers for media under 1 minute
                this._MINIMUM_MEDIA_LENGTH_FOR_DEFAULT_MARKERS = 60;
                // This number represents the minimum time range where scrubbing is accurate with gesture.
                this._MINIMUM_ACCURATE_SEEKABLE_RANGE = 1800;
                // The minimum distance between consecutive pointer events for the MediaPlayer's
                // scrubbing logic to determine that the user is moving "quickly" across the timeline
                // and does not want the "sticky marker" behavior. Units are in pixels.
                this._MINIMUM_POINTER_DELTA_TO_ENABLE_SNAPPING_TO_NEAREST_MARKER = 4;
                // The amount of space on the left and right of the user that is used for. 
                // using gesture to move the seekable window. Units are in pixels.
                this._GESTURE_REGION_FOR_MOVING_THE_SEEKABLE_WINDOW = 200;
                // We report media state to various listeners via the Playback Manager every 30 seconds.
                this._REPORT_MEDIA_STATE_INTERVAL = 5000;
                this._SEEK_OFFSET = 0.1;
                this._SKIP_BACK_INTERVAL = 8;
                this._SKIP_FORWARD_INTERVAL = 30;
                // If the user is scrubbing and the timeline is within a distance of
                // a marker, the timeline will snap to the marker. The Value is expressed 
                // as a percentage of the total length of the timeline.
                this._SNAP_TO_NEAREST_MARKER_THRESHOLD = 0.005;

                // PlaybackRates
                this._PLAYBACKRATE_FAST_FORWARD_MAX_RATE = 128;
                this._PLAYBACKRATE_FAST_FORWARD_128X = 128;
                this._PLAYBACKRATE_FAST_FORWARD_64X = 64;
                this._PLAYBACKRATE_FAST_FORWARD_32X = 32;
                this._PLAYBACKRATE_FAST_FORWARD_16X = 16;
                this._PLAYBACKRATE_FAST_FORWARD_8X = 8;
                this._PLAYBACKRATE_FAST_FORWARD_4X = 4;
                this._PLAYBACKRATE_FAST_FORWARD_2X = 2;
                this._PLAYBACKRATE_FAST_FORWARD_SLOW_MOTION_RATE = 0.5;
                this._PLAYBACKRATE_PLAYING = 1;
                this._PLAYBACKRATE_NOT_PLAYING = 1;
                this._PLAYBACKRATE_REWIND_SLOW_MOTION_RATE = -0.5;
                this._PLAYBACKRATE_REWIND_2X = -2;
                this._PLAYBACKRATE_REWIND_4X = -4;
                this._PLAYBACKRATE_REWIND_8X = -8;
                this._PLAYBACKRATE_REWIND_16X = -16;
                this._PLAYBACKRATE_REWIND_32X = -32;
                this._PLAYBACKRATE_REWIND_64X = -64;
                this._PLAYBACKRATE_REWIND_128X = -128;
                this._PLAYBACKRATE_REWIND_MAX_RATE = -128;

                // MEDIA ELEMENT TAG NAMES
                this._TAG_NAME_AUDIO = "AUDIO";
                this._TAG_NAME_VIDEO = "VIDEO";

                // This is the innerHTML that gets rendered when the MediaPlayer is instantiated.
                this._mediaPlayerHtml = '<div class="win-mediaplayer-container">' +
                                        '   <div class="win-mediaplayer-controls win-mediaplayer-hidden">' +
                                        '       <div class="win-mediaplayer-mediatitle"></div>' +
                                        '       <div class="win-mediaplayer-mediadescription"></div>' +
                                        '       <div class="win-mediaplayer-transportcontrols">' +
                                        '        <div class="win-mediaplayer-timeline win-mediaplayer-thumbnailmode" tabIndex="0">' +
                                        '            <div class="win-mediaplayer-progresscontainer">' +
                                        '                <div class="win-mediaplayer-seekbar">' +
                                        '                  <div class="win-mediaplayer-buffer"></div>' +
                                        '                  <div class="win-mediaplayer-seekprogress"></div>' +
                                        '                  <div class="win-mediaplayer-seekbarvisualelements-container">' +
                                        '                      <div class="win-mediaplayer-thumb win-mediaplayer-hidden">' +
                                        '                          <div class="win-mediaplayer-thumbvisual"></div>' +
                                        '                      </div>' +
                                        '                      <div class="win-mediaplayer-thumbnail win-mediaplayer-hidden">' +
                                        '                          <div class="win-mediaplayer-thumbnailvisual">' +
                                        '                              <div class="win-mediaplayer-playbackspeedindicator"></div>' +
                                        '                              <div class="win-mediaplayer-seektimeindicator"></div>' +
                                        '                          </div>' +
                                        '                      </div>' +
                                        '                      <div class="win-mediaplayer-seek-mark"></div>' +
                                        '                  </div>' +
                                        '                  <div class="win-mediaplayer-seek-leftboundary win-invisible"></div>' +
                                        '                  <div class="win-mediaplayer-seek-rightboundary win-invisible"></div>' +
                                        '                </div>' +
                                        '                <div class="win-mediaplayer-currenttimeindicator"></div>' +
                                        '                <div class="win-mediaplayer-timeremainingindicator"></div>' +
                                        '                <div class="win-mediaplayer-totaltimeindicator"></div>' +
                                        '            </div>' +
                                        '            <div class="win-mediaplayer-inputfeedback"></div>' +
                                        '         </div>' +
                                        '         <div class="win-mediaplayer-commands" data-win-control="WinJS.UI.ToolBar">' +
                                        '         </div>' +
                                        '       </div>' +
                                        '    </div>' +
                                        '</div>' +
                                        '<div class="win-mediaplayer-inputhandler"></div>' +
                                        '<progress class="win-mediaplayer-busy win-mediaplayer-hidden win-ring win-large"></progress>';

                var that = this;
                this._builtInButtonsList = [
                       {
                           internalVariableName: "_playFromBeginningButton",
                           classList: "win-mediaplayer-playfrombeginningbutton",
                           options: {
                               id: "win-mediaplayer-playfrombeginning",
                               label: strings.mediaPlayerPlayFromBeginningButtonLabel,
                               section: 'primary',
                               tooltip: strings.mediaPlayerPlayFromBeginningButtonLabel,
                               priority: 19,
                               icon: "refresh",
                               hidden: true,
                               onclick: this._onPlayFromBeginningCommandInvoked.bind(this)
                           },
                       },
                       {
                           internalVariableName: "_chapterSkipBackButton",
                           classList: "win-mediaplayer-chapterskipbackbutton",
                           options: {
                               id: "win-mediaplayer-chapterskipback",
                               label: strings.mediaPlayerChapterSkipBackButtonLabel,
                               tooltip: strings.mediaPlayerChapterSkipBackButtonLabel,
                               section: 'primary',
                               priority: 17,
                               icon: "back",
                               hidden: true,
                               onclick: this._onChapterSkipBackCommandInvoked.bind(this)
                           }
                       },
                       {
                           internalVariableName: "_previousTrackButton",
                           classList: "win-mediaplayer-previoustrackbutton",
                           options: {
                               id: "win-mediaplayer-previoustrack",
                               label: strings.mediaPlayerPreviousTrackButtonLabel,
                               tooltip: strings.mediaPlayerPreviousTrackButtonLabel,
                               section: 'primary',
                               priority: 15,
                               icon: "previous",
                               hidden: true,
                               onclick: this._onPlayFromBeginningCommandInvoked.bind(this)
                           }
                       },
                       {
                           internalVariableName: "_stopButton",
                           classList: "win-mediaplayer-stopbutton",
                           options: {
                               id: "win-mediaplayer-stop",
                               label: strings.mediaPlayerStopButtonLabel,
                               tooltip: strings.mediaPlayerStopButtonLabel,
                               section: 'primary',
                               priority: 18,
                               icon: "stop",
                               hidden: true,
                               onclick: this._onStopCommandInvoked.bind(this)
                           },
                       },
                       {
                           internalVariableName: "_timeSkipBackButton",
                           classList: "win-mediaplayer-timeskipbackbutton",
                           options: {
                               id: "win-mediaplayer-timeskipback",
                               label: strings.mediaPlayerTimeSkipBackButtonLabel,
                               tooltip: strings.mediaPlayerTimeSkipBackButtonLabel,
                               section: 'primary',
                               priority: 11,
                               icon: "undo",
                               hidden: true,
                               onclick: this._onTimeSkipBackCommandInvoked.bind(this)
                           },
                       },
                       {
                           internalVariableName: "_rewindButton",
                           classList: "win-mediaplayer-rewindbutton",
                           options: {
                               id: "win-mediaplayer-rewind",
                               label: strings.mediaPlayerRewindButtonLabel,
                               tooltip: strings.mediaPlayerRewindButtonLabel,
                               section: 'primary',
                               priority: 13,
                               icon: "previous",
                               hidden: true,
                               onclick: this._onRewindCommandInvoked.bind(this)
                           }
                       },
                       {
                           internalVariableName: "_castButton",
                           classList: "win-mediaplayer-playonremotedevicebutton",
                           options: {
                               id: "win-mediaplayer-playonremotedevice",
                               label: strings.mediaPlayerCastButtonLabel,
                               tooltip: strings.mediaPlayerCastButtonLabel,
                               section: 'primary',
                               priority: 6,
                               icon: "\uEC15",
                               onclick: this._onCastCommandInvoked.bind(this)
                           }
                       },
                       {
                           internalVariableName: "_zoomButton",
                           classList: "win-mediaplayer-zoombutton",
                           options: {
                               id: "win-mediaplayer-zoom",
                               label: strings.mediaPlayerZoomButtonLabel,
                               tooltip: strings.mediaPlayerZoomButtonLabel,
                               section: 'primary',
                               priority: 7,
                               icon: "\uE799",
                               onclick: this._onZoomCommandInvoked.bind(this)
                           }
                       },
                       {
                           internalVariableName: "_audioTracksButton",
                           classList: "win-mediaplayer-audiotracksbutton",
                           options: {
                               id: "win-mediaplayer-audiotracks",
                               label: strings.mediaPlayerAudioTracksButtonLabel,
                               tooltip: strings.mediaPlayerAudioTracksButtonLabel,
                               priority: 8,
                               section: 'primary',
                               icon: "\uE8C1",
                               hidden: true,
                               onclick: this._onAudioTracksCommandInvoked.bind(this)
                           }
                       },
                       {
                           internalVariableName: "_playPauseButton",
                           classList: "win-mediaplayer-playpausebutton",
                           options: {
                               id: "win-mediaplayer-playpause",
                               label: strings.mediaPlayerPlayButtonLabel,
                               tooltip: strings.mediaPlayerPlayButtonLabel,
                               section: 'primary',
                               priority: 1,
                               icon: "play",
                               onclick: this._onPlayPauseCommandInvoked.bind(this)
                           },
                       },
                       {
                           internalVariableName: "_closedCaptionsButton",
                           classList: "win-mediaplayer-closedcaptionsbutton",
                           options: {
                               id: "win-mediaplayer-closedcaptions",
                               label: strings.mediaPlayerClosedCaptionsButtonLabel,
                               tooltip: strings.mediaPlayerClosedCaptionsButtonLabel,
                               section: 'primary',
                               priority: 4,
                               icon: "\uE7F0",
                               hidden: true,
                               onclick: this._onClosedCaptionsCommandInvoked.bind(this)
                           }
                       },
                       {
                           internalVariableName: "_volumeButton",
                           classList: "win-mediaplayer-volumebutton",
                           options: {
                               id: "win-mediaplayer-volume",
                               label: strings.mediaPlayerVolumeButtonLabel,
                               section: 'primary',
                               tooltip: strings.mediaPlayerVolumeButtonLabel,
                               priority: 3,
                               icon: "volume",
                               onclick: this._onVolumeCommandInvoked.bind(this)
                           }
                       },
                       {
                           internalVariableName: "_toggleFullScreenButton",
                           classList: "win-mediaplayer-fullscreenbutton",
                           options: {
                               id: "win-mediaplayer-fullscreen",
                               label: strings.mediaPlayerFullscreenButtonLabel,
                               tooltip: strings.mediaPlayerFullscreenButtonLabel,
                               section: 'primary',
                               priority: 5,
                               icon: "fullscreen",
                               onclick: this._onToggleFullscreenCommandInvoked.bind(this)
                           }
                       },
                       {
                           internalVariableName: "_timeSkipForwardButton",
                           classList: "win-mediaplayer-timeskipforwardbutton",
                           options: {
                               id: "win-mediaplayer-timeskipforward",
                               label: strings.mediaPlayerTimeSkipForwardButtonLabel,
                               tooltip: strings.mediaPlayerTimeSkipForwardButtonLabel,
                               section: 'primary',
                               priority: 10,
                               icon: "redo",
                               hidden: true,
                               onclick: this._onTimeSkipForwardCommandInvoked.bind(this)
                           },
                       },
                       {
                           internalVariableName: "_fastForwardButton",
                           classList: "win-mediaplayer-fastforwardbutton",
                           options: {
                               id: "win-mediaplayer-fastforward",
                               label: strings.mediaPlayerFastForwardButtonLabel,
                               tooltip: strings.mediaPlayerFastForwardButtonLabel,
                               priority: 12,
                               section: 'primary',
                               icon: "next",
                               hidden: true,
                               onclick: this._onFastForwardCommandInvoked.bind(this)
                           }
                       },
                       {
                           internalVariableName: "_playbackRateButton",
                           classList: "win-mediaplayer-playbackratebutton",
                           options: {
                               id: "win-mediaplayer-playbackrate",
                               label: strings.mediaPlayerPlayRateButtonLabel,
                               tooltip: strings.mediaPlayerPlayRateButtonLabel,
                               section: 'primary',
                               priority: 9,
                               icon: "\uEC57",
                               hidden: true,
                               onclick: this._onPlaybackRateCommandInvoked.bind(this)
                           },
                       },
                       {
                           internalVariableName: "_nextTrackButton",
                           classList: "win-mediaplayer-nexttrackbutton",
                           options: {
                               id: "win-mediaplayer-nexttrack",
                               label: strings.mediaPlayerNextTrackButtonLabel,
                               tooltip: strings.mediaPlayerNextTrackButtonLabel,
                               section: 'primary',
                               priority: 14,
                               icon: "next",
                               hidden: true,
                               onclick: this._onNextTrackCommandInvoked.bind(this)
                           }
                       },
                       {
                           internalVariableName: "_chapterSkipForwardButton",
                           classList: "win-mediaplayer-chapterskipforwardbutton",
                           options: {
                               id: "win-mediaplayer-chapterskipforward",
                               label: strings.mediaPlayerChapterSkipForwardButtonLabel,
                               tooltip: strings.mediaPlayerChapterSkipForwardButtonLabel,
                               priority: 16,
                               section: 'primary',
                               icon: "forward",
                               hidden: true,
                               onclick: this._onChapterSkipForwardCommandInvoked.bind(this)
                           }
                       },
                       {
                           internalVariableName: "_goToLiveButton",
                           classList: "win-mediaplayer-livebutton",
                           options: {
                               id: "win-mediaplayer-live",
                               label: strings.mediaPlayerLiveButtonLabel,
                               tooltip: strings.mediaPlayerLiveButtonLabel,
                               section: 'primary',
                               priority: 20,
                               icon: "gotostart",
                               hidden: true,
                               onclick: this._onLiveButtonCommandInvoked.bind(this)
                           }
                       }

                ];

                this._playPauseCompactIndex = 0;
                this._playPauseFullIndex = -1; // default -1 indicates missing PlayPauseButton
                this._isCommandsSetByUser = false;

                //PlayPause Index in the builtInButtonsList
                for (var i = 0, len = this._builtInButtonsList.length; i < len; i++) {
                    if (this._builtInButtonsList[i].options.id === "win-mediaplayer-playpause") {
                        this._playPauseFullIndex = i;
                        break;
                    }
                }


                // Note: We need to initialize _keydownInputHandler here, because it is used by fullScreen
                this._keydownInputHandler = function handleKeyDownInput(eventObject) {
                    that._onInputHandlerKeyDown(eventObject);
                };

                this._keyupInputHandler = function handleKeyUpInput(eventObject) {
                    that._onInputHandlerKeyUp(eventObject);
                };

                this._fullScreenChangeHandler = function handleFullScreenChange(eventObject) {

                    var fullScreenElement = _Global.document.fullscreenElement ||
                                                   _Global.document.msFullscreenElement ||
                                                   _Global.document.mozFullScreenElement ||
                                                   _Global.document.webkitFullscreenElement;
                    if (!fullScreenElement && that.isFullScreen) {
                        // make sure MediaPlayer also exits the fullscreen, since we exited the fullscreen thru other means like escape key
                        that.isFullScreen = false;
                    }
                };

                this._fullScreenErrorHandler = function handleFullScreenError(eventObject) {
                    // always reset back to non-fullscreen in case of error, if we already in fullscreen.
                    if (that.isFullScreen) {
                        that.isFullScreen = false;
                    }
                };

                this._controlsKeyupInputHandler = function handleControlsKeyInput(eventObject) {
                    that._onControlsKeyupInputHandler(eventObject);
                };

                this._windowResizeCallback = function handleResize() {
                    if (that._disposed) {
                        return;
                    }

                    var mediaPlayerContainer = that._element.querySelector(".win-mediaplayer-controls");
                    if (!mediaPlayerContainer) {
                        return;
                    }

                    if (_WinRT.Windows.System.Profile.AnalyticsInfo &&
                        _WinRT.Windows.System.Profile.AnalyticsInfo.versionInfo.deviceFamily === "Windows.Xbox") {
                        if (this._isXboxSnapMode) {
                            utilities.removeClass(mediaPlayerContainer, "win-mediaplayer-hidden");
                            that.showControls();
                        } else {
                            utilities.addClass(mediaPlayerContainer, "win-mediaplayer-hidden");

                            // Note: We need to reset this field so the MediaPlayer can maintain the correct
                            // UI state. If _controlsVisible = true, which would be the case if the controls
                            // were up right before the MediaPlayer was snapped then when the MediaPlayer returns
                            // from being snapped _controlsVisible will still be true even though the
                            // controls may or may not be visible.
                            that._controlsVisible = false;
                            that.hideControls();
                        }
                    }

                    if (_WinRT.Windows.UI.ViewManagement.ApplicationView) {
                        var applicationView = _WinRT.Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
                        var fullscreenMode = applicationView.isFullScreenMode;
                        // This will cause the MediaPlayer to exit its full screen mode when the user clicks the exit full screen button in the app's title bar."
                        if (!fullscreenMode && that.isFullScreen) {
                            that.isFullScreen = false;
                        }
                    }

                    // Update the controls if they are visible
                    if (that._controlsVisible) {
                        that._updateChapterMarkerVisuals();
                        that._updateTimelineVisuals();
                    }

                    // Update the timeline sizes
                    Scheduler.schedule(function () {
                        if (that._disposed) {
                            return;
                        }

                        that._totalSeekBarWidth = that._seekBar.clientWidth;
                        that._seekBarLeftOffset = that._seekBar.offsetLeft;
                        that._thumbElementWidthDividedByTwo = that._thumbElement.clientWidth / 2;
                        that._thumbImageElementWidthDividedByTwo = that._thumbnailImage.clientWidth / 2;
                    }, Scheduler.Priority.normal, this, "WinJS.UI.MediaPlayer._updateTimelineSizes");
                };
                _ElementUtilities._resizeNotifier.subscribe(this._element, this._windowResizeCallback);

                this._initializeDomElements();

                // Set the rest of the options
                if (options) {
                    _Control.setOptions(this, options);
                }

                // Create a default mediaElementAdapter if none was specified
                if (!this._mediaElementAdapter) {
                    this.mediaElementAdapter = new MediaElementAdapter(this, null);
                }

                // If we are starting in snapped mode then we need to show controls
                if (this._isXboxSnapMode) {
                    this._showControls(true);
                }

                this._handleBeforeNavigatedCallback = function () {
                    that._handleBeforeNavigated();
                };

                nav._navigationListener.addEventListener(this.element, "beforenavigate", this._handleBeforeNavigatedCallback);

                // Set a timer to report state to SmartGlass periodically
                this._updateMediaStateBind = this._updateMediaState.bind(this);
                this._updateMediaStateTimerCookie = _Global.setInterval(this._updateMediaStateBind, this._REPORT_MEDIA_STATE_INTERVAL);

                utilities._webUIApplicationListener.addEventListener(this.element, "resuming", this._checkParentalControlsAvailableBind);

                if (this._contentRestrictions) {
                    this._contentRestrictions.addEventListener("restrictionschanged", this._checkParentalControlsBind, false);
                }

                // Listen for active listening & show the controls and don't hide them until we go out of active listening
                this._onShowControlsCommandInvokedBind = this._onShowControlsCommandInvoked.bind(this);
                this._onHideControlsCommandInvokedBind = this._onHideControlsCommandInvoked.bind(this);

                // Set up the system transport controls event handlers
                if (_WinRT.Windows.Media.SystemMediaTransportControls) {
                    // We need to set the enabled state for stop during construction
                    this._smtControls.isStopEnabled = nav.canGoBack;
                    this._handleSystemTransportControlsButtonPressedBind = this._handleSystemTransportControlsButtonPressed.bind(this);
                    this._handleSystemTransportControlsPropertyChangedBind = this._handleSystemTransportControlsPropertyChanged.bind(this);
                    utilities._smtcListener.addEventListener(this.element, "buttonpressed", this._handleSystemTransportControlsButtonPressedBind);
                    utilities._smtcListener.addEventListener(this.element, "propertychanged", this._handleSystemTransportControlsPropertyChangedBind);
                }

                this._handleloadTextTrackCallbackBind = this._handleloadTextTrackCallback.bind(this);
                _WriteProfilerMark("WinJS.UI.MediaPlayer:constructor,StopTM");
            },
            {
                // Private properties
                _isBusy: {

                    get: function () {
                        return this._isBusyInternal;
                    },

                    set: function (value) {
                        if (this._disposed) {
                            return;
                        }
                        // we are already in same state.
                        if (this._isBusyInternal === value) {
                            return;
                        }

                        this._isBusyInternal = value;

                        var that = this;
                        if (value) {
                            utilities.removeClass(this._busyIndicator, "win-mediaplayer-hidden");
                            _TransitionAnimation.executeTransition(this._busyIndicator,
                                [{
                                    property: "opacity",
                                    delay: 0,
                                    duration: 200,
                                    timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
                                    from: 0,
                                    to: 1
                                }]);
                        } else {
                            // The duration of the fade out is set to one second to avoid flicker.
                            Promise.timeout(1000).then(function afterShortDelay() {
                                if (!that._busyIndicator) {
                                    return;
                                }

                                var fadeOutSpinnerAnimationPromise = _TransitionAnimation.executeTransition(that._busyIndicator,
                                    [{
                                        property: "opacity",
                                        delay: 0,
                                        duration: 200,
                                        timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
                                        from: 1,
                                        to: 0
                                    }]);
                                fadeOutSpinnerAnimationPromise.done(function afterSpinnerFadeOut() {
                                    if (that._busyIndicator) {
                                        utilities.addClass(that._busyIndicator, "win-mediaplayer-hidden");
                                    }
                                });
                            });
                        }

                        this._updateMediaState(false);
                    }
                },

                _isXbox: {
                    get: function () {
                        if (_WinRT.Windows.System.Profile.AnalyticsInfo &&
                            _WinRT.Windows.System.Profile.AnalyticsInfo.versionInfo.deviceFamily === "Windows.Xbox") {
                            return true;
                        } else {
                            return false;
                        }
                    }
                },

                _isXboxSnapMode: {
                    get: function () {
                        if (this._isXbox &&
                            _Global.window.screenWidth <= 480) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                },

                _totalTime: {

                    get: function () {
                        return this._totalTimeInternal;
                    },

                    set: function (value) {

                        this._totalTimeInternal = value;

                        if (!this._markers.length &&
                            this._totalTimeInternal > this._MINIMUM_MEDIA_LENGTH_FOR_DEFAULT_MARKERS) {
                            this._initializeDefaultChapterMarkers();
                        } else {
                            this._defaultChapterMarkers.length = 0;
                        }
                    }
                },

                // Private methods

                // Add an event handler for a button. This method tracks keeps a list of the handlers so they can be unsubscribed later.
                _addButtonEventHandler: function (button, eventName, handler) {

                    if (button) {
                        var that = this;
                        var buttonClickEventSubscription = {
                            button: button,
                            eventName: eventName,
                            handler: function (ev) {
                                handler.call(that, ev);
                                // If the button was clicked via voice, we need to play the press animation
                                if (ev.type === "click" &&
                                    !ev.deviceSessionId) {
                                    var buttonIcon = ev.target.querySelector(".win-mediaplayer-icon");
                                    if (buttonIcon) {
                                        _TransitionAnimation.executeTransition(buttonIcon, [{
                                            property: _BaseUtils._browserStyleEquivalents["transform"].cssName,
                                            delay: 0,
                                            duration: 100,
                                            timing: "ease-out",
                                            from: "scale(2)",
                                            to: "scale(1)"
                                        }]);
                                    }
                                }
                            }
                        };

                        button.addEventListener(eventName, buttonClickEventSubscription.handler, false);
                        this._buttonEventSubscriptions.push(buttonClickEventSubscription);
                    }
                },

                // Add a handler for gesture events. This method tracks keeps a list of the handlers so they can be unsubscribed later.
                _addGestureEventHandler: function (owner, eventName, handler) {

                    var that = this;
                    var gestureEventSubscription = {
                        owner: owner,
                        eventName: eventName,
                        handler: function (ev) {
                            handler.call(that, ev);
                        }
                    };

                    owner.addEventListener(eventName, gestureEventSubscription.handler, false);
                    this._gestureEventSubscriptions.push(gestureEventSubscription);
                },

                // Add a media event listener. This method tracks keeps a list of the handlers so they can be unsubscribed later.
                _addMediaEventListener: function (mediaElement, eventName, handler) {

                    if (mediaElement) {
                        mediaElement.addEventListener(eventName, handler, false);
                        if (this._mediaEventSubscriptions) {
                            this._mediaEventSubscriptions.push({ eventName: eventName, handler: handler });
                        }
                    }
                },

                // Checks if the content restrictions are such that the user is allowed to stream video
                _checkParentalControls: function () {
                    // If contentRating has been set to a valid contentRating, then
                    // we check the family settings to see if the user is allowed to
                    // view the content.
                    if (!_WinRT.Windows.Xbox ||
                        !this._mediaMetadata ||
                        !this._mediaMetadata.contentRating ||
                        !this._mediaMetadata.contentType ||
                        !this._mediaMetadata.contentId) {
                        return Promise.wrap(true);
                    }

                    // We need to map the contentType from the one in the WinJS.Data.ContentType
                    // enumeration to the contentType enumeration in the family safety API.
                    var contentType = this._mediaMetadata.contentType;
                    var contentDescription = new _WinRT.Windows.Media.ContentRestrictions.RatedContentDescription(
                        this._mediaMetadata.contentId,
                        this._mediaMetadata.title,
                        null,
                        contentType
                    );

                    contentDescription.category = contentType;
                    var ratingArray = [];
                    if (Array.isArray(this._mediaMetadata.contentRating)) {
                        ratingArray = this._mediaMetadata.contentRating;
                    } else {
                        ratingArray = [this._mediaMetadata.contentRating];
                    }
                    for (var i = 0, len = ratingArray.length; i < len; i++) {
                        contentDescription.ratings[i] = ratingArray[i];
                    }

                    return this._contentRestrictions.requestContentAccessAsync(contentDescription);
                },

                _checkParentalControlsAvailable: function () {
                    if (this._disposed) {
                        return;
                    }

                    var that = this;

                    var hasParentalControlsPrivilege = false;
                    var checkParentalControlsPromise = this._checkParentalControlsBind()
                        .then(
                            function afterParentalControlsCheck(result) {
                                if (result) {
                                    hasParentalControlsPrivilege = true;
                                } else {
                                    hasParentalControlsPrivilege = false;
                                }
                            },
                            function error() {
                                hasParentalControlsPrivilege = false;
                            });

                    Promise.join(checkParentalControlsPromise)
                        .then(
                            function afterPriviledgeChecksHaveCompleted() {
                                if (hasParentalControlsPrivilege) {
                                    // No-op - continue video playback
                                } else {
                                    // The expected behavior is to navigate back, or if there is no back stack, pause the media
                                    // and hide it.
                                    if (nav.canGoBack) {
                                        nav.back();
                                    } else {
                                        that.pause();
                                        if (that._mediaElementAdapter.mediaElement) {
                                            that._mediaElementAdapter.mediaElement.style.display = "none";
                                        }
                                    }
                                }
                            },
                            function error() {
                                // No-op. This error handler should never get called in practice. But it exists, because
                                // if there is an async error and the error handler is not defined, the app will crash.
                            });
                },

                // Removes the DOM elements from the timeline that are used to visualize chapter markers.
                // This function does not remove chapter markers from the _markers or _defaultChapterMarkers array.
                _clearChapterMarkerVisuals: function () {

                    // We need to make sure the _element is not null, which is possible if dispose was called
                    if (this._disposed) {
                        return;
                    }

                    this._clearDefaultChapterMarkers();

                    // Remove custom chapter markers if they exist
                    var markersLength = this._markers.length;
                    for (var i = 0; i < markersLength; i++) {

                        if (this._markers[i].type === markerType.chapter) {
                            var time = this._markers[i].time;

                            var marker = this._element.querySelector("#ms__marker" + (time.toString()).replace(".", "_"));

                            // Note: This check is necessary, because the markers in the _markers collection do not
                            // always have a corresponding DOM element on the timeline. This is because we add the marker visuals
                            // at a different time than we add them to the _markers array.
                            if (marker &&
                                marker.parentNode) {
                                marker.parentNode.removeChild(marker);
                            }
                        }
                    }
                },

                // Removes the default chapters markers and DOM elements used to represent the default chapter markers.
                _clearDefaultChapterMarkers: function () {

                    if (this._disposed) {
                        return;
                    }

                    var defaultChapterMarkersLength = this._defaultChapterMarkers.length;
                    for (var i = 0; i < defaultChapterMarkersLength; i++) {

                        if (this._defaultChapterMarkers[i].type === markerType.chapter) {
                            var time = this._defaultChapterMarkers[i].time;

                            var marker = this._element.querySelector("#ms__marker" + (time.toString()).replace(".", "_"));
                            if (marker &&
                                marker.parentNode) {
                                marker.parentNode.removeChild(marker);
                            }
                        }
                    }

                    this._defaultChapterMarkers.length = 0;
                },

                // Clears the feedback text on the timeline that shows the last executed media command.
                _clearMediaCommandFeedbackText: function () {

                    if (this._mediaCommandFeedbackText) {
                        this._mediaCommandFeedbackText.textContent = "";
                    }
                },

                _clearTimeDisplay: function () {

                    if (this._currentTimeIndicator &&
                        this._totalTimeIndicator) {
                        this._currentTimeIndicator.textContent = "";
                        this._totalTimeIndicator.textContent = "";
                        this._seekTimeIndicator.textContent = "";
                    }
                },

                // Formats time in seconds to the hh:mm:ss format.
                _defaultTimeFormatter: function (seconds) {

                    if (isNaN(seconds)) {
                        return "";
                    }

                    var minutes = Math.floor(seconds / 60);
                    seconds = Math.floor(seconds % 60);
                    var hours = Math.floor(minutes / 60);
                    minutes = minutes % 60;

                    var timeString = "";
                    if (hours > 0) {
                        timeString = hours.toString() + this._timeSeparator + this._getTimeString(minutes) + this._timeSeparator + this._getTimeString(seconds);
                    } else {
                        timeString = minutes.toString() + this._timeSeparator + this._getTimeString(seconds);
                    }

                    return timeString;
                },

                // Helper to raise a cancellable event through the containerElement
                _dispatchCancellableEvent: function (eventName, detail) {
                    if (this._disposed) {
                        // We return true because the event will never get raised if the control is disposed.
                        // Therefore the developer could not have prevented the event so the only possible return
                        // value is true.
                        return true;
                    }

                    var dispatchedEvent = _Global.document.createEvent("Event");
                    dispatchedEvent.initEvent(eventName, true, true);

                    if (detail) {
                        dispatchedEvent.detail = detail;
                    }

                    return this._element.dispatchEvent(dispatchedEvent);
                },

                _exitFastForwardOrRewind: function (shouldPlay) {

                    if (!this._isInFastForwardOrRewindMode) {
                        return;
                    }

                    _Global.clearInterval(this._fastForwardOrRewindTimer);
                    this._fastForwardOrRewindTimer = null;
                    this._isInFastForwardOrRewindMode = false;

                    // Hide the thumbnails. We do this regardless of whether thumbnail mode is enabled,
                    // because it will be a no-op if thumbnail mode is disabled.
                    if (this._thumbnailImage) {
                        utilities.addClass(this._thumbElement, "win-mediaplayer-hidden");
                        utilities.addClass(this._thumbnailImage, "win-mediaplayer-hidden");

                        utilities.removeClass(this._element, "win-mediaplayer-scrubbing");
                        utilities.removeClass(this._element, "win-mediaplayer-rewind");
                        utilities.removeClass(this._element, "win-mediaplayer-fastforward");
                    }

                    if (this._simulatedFastForwardMode &&
                        this._mediaElementAdapter &&
                        this._isFastForwardOrRewind(this._targetPlaybackRate)) {
                        if (this._mediaElementAdapter &&
                            this._mediaElementAdapter.mediaElement &&
                            this._mediaElementAdapter.mediaElement.readyState >= this._MediaReadyState.MediaReadyState_Have_FutureData) {
                            // If we are past the endTime, we need to seek to just before the endTime so the developer can
                            // get the ended event on the mediaElement.
                            this._shouldPlayAfterExitingFastForwardOrRewind = shouldPlay;

                            // Reset the playbackRate to the previous value
                            this._mediaElementAdapter.mediaElement.playbackRate = this._previousPlaybackRate;

                            if (!this._handleSeekedAfterExitFastForwardOrRewindBind) {
                                this._handleSeekedAfterExitFastForwardOrRewindBind = this._handleSeekedAfterExitFastForwardOrRewind.bind(this);
                            }
                            this._mediaElementAdapter.mediaElement.addEventListener("seeked", this._handleSeekedAfterExitFastForwardOrRewindBind, false);
                            if (this._targetCurrentTime > this._endTime - this._SEEK_OFFSET &&
                                !this._wasTimeClampedToEndTime) {
                                this._wasTimeClampedToEndTime = true;
                                this._seekInternal(this._endTime - this._SEEK_OFFSET, false);
                            } else {
                                this._seekInternal(this._targetCurrentTime, false);
                            }
                        }

                        this._targetPlaybackRate = 1;
                    }

                    // Since the auto-hide timer is disabled in fast forward or rewind mode,
                    // we need to manually hide the controls.
                    if (this._controlHideTimeout) {
                        this._removeControlsTimer();
                    }
                },

                // Pads seconds or minutes with leading zeros and returns string format. Seconds or Minutes should be less than 60.
                _getTimeString: function (secondsOrMinutes) {

                    var stringForm = secondsOrMinutes.toString();

                    if (secondsOrMinutes < 10) {
                        stringForm = "0" + stringForm;
                    }

                    return stringForm;
                },

                _getTotalTimeText: function () {

                    var totalTime = "";
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        this._totalTime !== Infinity) {
                        totalTime = Math.ceil(this._totalTime);
                    }

                    return this._timeFormatter(totalTime);
                },

                _getElapsedTimeText: function () {

                    var elapsedTime = "";
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {

                        var currentTime = 0;
                        if (!this._isInFastForwardOrRewindMode) {
                            currentTime = this._mediaElementAdapter.mediaElement.currentTime;
                        } else {
                            currentTime = this._targetCurrentTime;
                        }

                        if (currentTime < this._startTime) {
                            currentTime = this._startTime;
                        } else if (currentTime > this._endTime) {
                            currentTime = this._endTime;
                        }

                        elapsedTime = Math.ceil(currentTime - this._startTime);
                    }

                    return this._timeFormatter(elapsedTime);
                },

                _getRemainingTimeText: function () {

                    var remainingTime = "";
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {

                        var currentTime = 0;
                        if (!this._isInFastForwardOrRewindMode) {
                            currentTime = this._mediaElementAdapter.mediaElement.currentTime;
                        } else {
                            currentTime = this._targetCurrentTime;
                        }

                        if (currentTime < this._startTime) {
                            currentTime = this._startTime;
                        } else if (currentTime > this._endTime) {
                            currentTime = this._endTime;
                        }

                        remainingTime = Math.ceil(this._endTime - (currentTime - this._startTime));
                    }

                    return "-" + this._timeFormatter(remainingTime);
                },

                _handlePointerDown: function (args) {
                    this._handlePointerMove(args);
                },

                // There are cases where the controls can disappear while gesture is engaged. To make sure this never happens,
                // we listen for hover and if the controls are ever not visible, we show them.
                _handlePointerHover: function (args) {
                    this._onShowControlsCommandInvokedBind();
                },

                _handlePointerMove: function (args) {
                    // The following data is used for gesture scrubbing
                    if (this._isThumbGrabbed) {
                        if (args.clientX < 100) {
                            this._isHandAtLeftEdge = true;
                        } else if (args.clientX > _Global.screen.availWidth - 100) {
                            this._isHandAtRightEdge = true;
                        } else {
                            this._isHandAtLeftEdge = false;
                            this._isHandAtRightEdge = false;
                            this._currentScrubbingVelocity = 0;
                        }
                    }
                },

                _handlePointerUp: function (args) {
                    // We have to ensure the up pointer is sent to IC, so treat it as a move first.
                    this._handlePointerMove(args);
                },

                _handleManipulationStarted: function (args) {
                    this._inputHandlerPointerDownCallback(args);
                },

                _handleManipulationEnd: function (args) {
                    this._inputHandlerPointerUpCallback(args);
                },

                _handleManipulationUpdated: function (args) {
                    this._inputHandlerPointerMoveCallback(args);
                },

                _handleManipulationCompleted: function (args) {
                    this._inputHandlerPointerUpCallback(args);
                },

                _handleBeforeNavigated: function () {
                    this._updateMediaState(true);
                },

                _handleSeekedAfterExitFastForwardOrRewind: function (shouldPlay) {
                    if (this._disposed) {
                        return;
                    }

                    this._mediaElementAdapter.mediaElement.removeEventListener("seeked", this._handleSeekedAfterExitFastForwardOrRewindBind);
                    // Note that we need to reset the playbackRate, because it is possible due to a race condition that the FastForwardRewind timer
                    // will set the playbackRate to zero, before the timer is cleared. This will cause the play to fail and the ended
                    // event will never fire. We always want to set the rate back to the default in this case.
                    if (this._shouldPlayAfterExitingFastForwardOrRewind) {
                        if (this._mediaElementAdapter &&
                            this._mediaElementAdapter.play) {
                            if (this._mediaElementAdapter.mediaElement.playbackRate === 0) {
                                this._mediaElementAdapter.mediaElement.playbackRate = this._mediaElementAdapter.mediaElement.defaultPlaybackRate;
                            }
                            this._mediaElementAdapter.play();
                        }
                    } else {
                        if (this._mediaElementAdapter &&
                            this._mediaElementAdapter.pause) {
                            if (this._mediaElementAdapter.mediaElement.playbackRate === 0) {
                                this._mediaElementAdapter.mediaElement.playbackRate = this._mediaElementAdapter.mediaElement.defaultPlaybackRate;
                            }
                            this._mediaElementAdapter.pause();
                        }
                    }
                },

                // Helper function to call when the start time is reached via a rewind operation
                _handleStartTimeReached: function () {

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {

                        this._exitFastForwardOrRewind(true);

                        // Note: We need to subtract an offset to ensure that we never seek past the startTime.
                        // Seeking on the media element is not 100% accurate. It will seek to the nearest frame rather
                        // than an exact timestamp. Therefore if we seek to the startTime, we may seek past the startTime.
                        var media = this._mediaElementAdapter.mediaElement;

                        // We need to make sure that we don't perform a seek if the media src was switch out from under us.
                        // Otherwise there will be an exception.
                        if (!this._isInFastForwardOrRewindMode &&
                            media.readyState >= this._MediaReadyState.MediaReadyState_Have_FutureData) {
                            this._seekInternal(this._startTime + this._SEEK_OFFSET, false);
                        }

                        this._clearMediaCommandFeedbackText();

                        if (media.loop) {
                            this._playFromBeginning();
                        }
                    }
                },

                // Helper function to call when the start time is reached via a fast forward operation or through regular playback
                _handleEndTimeReached: function () {

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        !this._endTimeReached) {
                        this._exitFastForwardOrRewind(true);

                        this._endTimeReached = true;

                        // Note: We need to subtract an offset to ensure that we never seek past the endTime.
                        // Seeking on the media element is not 100% accurate. It will seek to the nearest frame rather
                        // than an exact timestamp. Therefore if we seek to the endTime, we may seek past the endTime.
                        var media = this._mediaElementAdapter.mediaElement;

                        // We need to make sure that we don't perform a seek if the media src was switch out from under us.
                        // Otherwise there will be an exception.
                        if (!this._isInFastForwardOrRewindMode &&
                            media.readyState >= this._MediaReadyState.MediaReadyState_Have_FutureData &&
                            !this._wasTimeClampedToEndTime) {
                            this._wasTimeClampedToEndTime = true;
                            this._seekInternal(this._endTime - this._SEEK_OFFSET, false);
                        }

                        if (media.loop) {
                            this._playFromBeginning();
                            this._endTimeReached = false;
                        } else {
                            if (this._wasEndTimeSetProgrammatically) {
                                this.pause();
                            }
                            this._updateMediaState(true);
                        }

                        this._clearMediaCommandFeedbackText();
                    }
                },

                // Handles global speech media-related commands
                _handleSystemTransportControlsButtonPressed: function (ev) {
                    var smtControlsButton = _WinRT.Windows.Media.SystemMediaTransportControlsButton;
                    switch (ev.button) {
                        case smtControlsButton.play:
                            if (this.playPauseButtonEnabled && this.playPauseButtonVisible) {

                                if (this._mediaElementAdapter.mediaElement.paused) {
                                    this._showPauseButton();
                                    this.play();
                                } else {

                                    // If we are in fast forward / rewind mode, then exit to playing
                                    if (this._isInFastForwardOrRewindMode) {

                                        if (!this._simulatedFastForwardMode) {
                                            this._isInFastForwardOrRewindMode = false;
                                            this._mediaElementAdapter.mediaElement.playbackRate = this._mediaElementAdapter.mediaElement.defaultPlaybackRate;
                                        }

                                        this._showPauseButton();
                                        this.play();
                                    }
                                }
                            }
                            break;
                        case smtControlsButton.pause:
                            if (this.playbackRateButtonEnabled && this.playbackRateButtonVisible) {
                                this._showPlayButton();
                                this.pause();
                            }
                            break;
                        case smtControlsButton.stop:
                            Navigation.back();
                            break;
                        case smtControlsButton.fastForward:
                            if (this._isXboxSnapMode) {
                                if (!this._controlsVisible) {
                                    this._showControls();
                                }
                                this._fastForwardButton.focus();
                                this._fastForwardButton.click();
                            }
                            break;
                        case smtControlsButton.rewind:
                            if (this._isXboxSnapMode) {
                                if (!this._controlsVisible) {
                                    this._showControls();
                                }
                                this._rewindButton.focus();
                                this._rewindButton.click();
                            }
                            break;
                        case smtControlsButton.next:
                            if (this._isXboxSnapMode) {
                                if (!this._controlsVisible) {
                                    this._showControls();
                                }
                                this._nextTrackButton.focus();
                                this._nextTrackButton.click();
                                this._chapterSkipForwardButton.focus();
                                this._chapterSkipForwardButton.click();
                            }
                            break;
                        case smtControlsButton.previous:
                            if (this._isXboxSnapMode) {
                                if (!this._controlsVisible) {
                                    this._showControls();
                                }
                                this._previousTrackButton.focus();
                                this._previousTrackButton.click();
                                this._chapterSkipBackButton.focus();
                                this._chapterSkipBackButton.click();
                            }
                            break;
                        case smtControlsButton.channelUp:
                            // No-op - Windows only
                            break;
                        case smtControlsButton.channelDown:
                            // No-op - Windows only
                            break;
                        case smtControlsButton.back:
                            // No-op - This is handled by the page control
                            break;
                        case smtControlsButton.view:
                            // No-op
                        case smtControlsButton.menu:
                            // No-op
                            break;
                        default:
                            // No-op
                            break;
                    }
                },

                _handleSystemTransportControlsPropertyChanged: function (ev) {
                    var smtControlsProperty = _WinRT.Windows.Media.SystemMediaTransportControlsProperty;
                    var updater = this._smtControls.displayUpdater;
                    switch (ev.property) {
                        case smtControlsProperty.playbackPosition:
                            if (updater.type === _WinRT.Windows.Media.MediaPlaybackType.video) {
                                var numberOfMilisecondsInASecond = 1000;
                                this._seekInternal(updater.videoProperties.playbackPosition / numberOfMilisecondsInASecond, false);
                            }
                            break;
                        default:
                            break;
                    }
                },

                _handleTimelineArrowKeyDown: function (ev) {
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        (ev.key === "Left" ||
                        ev.key === "Right")) {
                        var newTime = 0;
                        var delta = this._totalTime / 100;
                        if (ev.key === "Left") {
                            newTime = this._mediaElementAdapter.mediaElement.currentTime - delta;
                        } else if (ev.key === "Right") {
                            newTime = this._mediaElementAdapter.mediaElement.currentTime + delta;
                        }
                        this._seekInternal(newTime);
                        // We need to stop propagation otherwise focus will cycle through other toolbar commands
                        // rather than moving the timeline position.
                        ev.stopPropagation();
                    }
                },

                _handleVolumeFlyoutShow: function () {
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {
                        if (this._volumeValue) {
                            this._volumeValue.textContent = this._mediaElementAdapter.mediaElement.volume * 100;
                        }
                        if (this._volumeSlider) {
                            this._volumeSlider.value = this._mediaElementAdapter.mediaElement.volume * 100;
                        }
                    }
                },

                _handleVolumeSliderChange: function () {
                    var newVolume = 0;
                    if (this._volumeSlider) {
                        newVolume = this._volumeSlider.value;
                    }
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {
                        this._mediaElementAdapter.mediaElement.volume = newVolume / 100;
                    }
                    if (this._volumeValue) {
                        this._volumeValue.textContent = newVolume;
                    }
                },

                // Hide the controls bar, this will initiate an slide out + fadeout animation immediately.
                _hideControls: function () {
                    _WriteProfilerMark("WinJS.UI.MediaPlayer:_hideControls,StartTM");

                    if (!this._controlsVisible ||
                        this._isXboxSnapMode ||
                        this._disposed) {
                        return;
                    }

                    var defaultNotPrevented = this._dispatchCancellableEvent("beforehidecontrols", {});

                    if (defaultNotPrevented) {
                        if (!this._isInFastForwardOrRewindMode && !this._isFlyoutOpen &&
                            !this._areControlsHiding) {

                            // We hide the back button for all platforms except the desktop and tablet where there is no hardware
                            // back button or well-known convention for the back button (eg. pressing B on Xbox)
                            if (nav.canGoBack &&
                                !_WinRT.Windows.Xbox) {
                                utilities.addClass(this._backButton.element, "win-mediaplayer-hidden");
                            }

                            this._areControlsHiding = true;
                            this._removeControlsTimer();

                            // Set focus off of the transport controls, otherwise if focus remains on one of
                            // the buttons, when the user presses 'A' to bring up the transport controls they
                            // may invoke one of the transport controls buttons without meaning to.
                            if (_Global.document.activeElement &&
                                this._transportControls.contains(_Global.document.activeElement)) {
                                this._element.focus();
                            }

                            var that = this;
                            this._playHideControlsAnimation()
                                .then(function () {
                                    if (that._disposed) {
                                        return;
                                    }

                                    _WriteProfilerMark("WinJS.UI.MediaPlayer:_hideControls,StopTM");

                                    that._controlsVisible = false;
                                    that._areControlsHiding = false;
                                    utilities.addClass(that._controls, "win-mediaplayer-hidden");
                                    that.dispatchEvent("afterhidecontrols", {});
                                });
                        }
                    } else {
                        // If hiding the controls has been prevented, we need to remove the auto-hide controls timer
                        // otherwise the controls will hide after a period of time.
                        this._removeControlsTimer();
                    }

                    if (!this._wasStartTimeSetProgrammatically &&
                        !this._wasEndTimeSetProgrammatically &&
                        this._markers.length) {
                        this._unsubscribeFromTimeUpdates();
                    }
                },

                _isFastForwardOrRewind: function (playbackRate) {
                    return ((playbackRate !== this._PLAYBACKRATE_PLAYING) && (playbackRate !== this._PLAYBACKRATE_NOT_PLAYING));
                },

                // Returns true if there is a flyout that has focus
                _isFocusOnAVisibleFlyout: function () {
                    var flyouts = _Global.document.querySelectorAll(".win-mediaplayer-overlay");
                    for (var i = 0, len = flyouts.length; i < len; i++) {
                        var flyoutElement = flyouts[i];
                        if (flyoutElement.contains(_Global.document.activeElement)) {
                            return true;
                        }
                    }

                    return false;
                },

                // Creates a list of chapter markers. This function does not render chapter markers. To do that, call _updateChapterMarkerVisuals.
                // If the media has no chapter markers and is below a certain length (this._MINIMUM_MEDIA_LENGTH_FOR_DEFAULT_MARKERS), then we add
                // 11 chapter markers spaced evenly along the timeline. When the user invokes chapter skip back / chapter skip forward, the media
                // will seek to the next / previous chapter marker.
                _initializeChapterMarkers: function (mediaElement) {

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:_initializeChapterMarkers,StartTM");

                    var textTracks = mediaElement.textTracks;

                    // We need to check if there are any existing chapter markers that were added as text tracks
                    var hasExistingChapterMarkers = false;
                    var textTracksLength = textTracks.length;
                    for (var i = 0; i < textTracksLength; i++) {
                        var currentTextTrack = textTracks[i];
                        if (currentTextTrack.kind === "chapters") {
                            hasExistingChapterMarkers = true;
                            break;
                        }
                    }

                    // We also need to check if there were any chapter markers added by the developer
                    if (!hasExistingChapterMarkers) {
                        var markersLength = this._markers.length;
                        for (var i = 0; i < markersLength; i++) {
                            if (this._markers[i].type === markerType.chapter) {
                                hasExistingChapterMarkers = true;
                            }
                        }
                    }

                    if (hasExistingChapterMarkers) {
                        this._initializeCustomChapterMarkers(mediaElement);
                    } else if (this._totalTime > this._MINIMUM_MEDIA_LENGTH_FOR_DEFAULT_MARKERS) {
                        this._initializeDefaultChapterMarkers();
                    }

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:_initializeChapterMarkers,StopTM");
                },

                _handleloadTextTrackCallback: function (eventObject) {
                    var textTrackCueList = eventObject;
                    var textTrackCueListLength = textTrackCueList.length;
                    for (var j = 0; j < textTrackCueListLength; j++) {
                        this.addMarker(textTrackCueList[j].startTime, markerType.chapter, textTrackCueList[j].text);
                    }
                },

                _handleFlyoutOpenCallback: function () {
                    // enable the flag to make sure won't hide.
                    this._isFlyoutOpen = true;
                },

                _handleFlyoutCloseCallback: function () {
                    // disable the flag to  hide.
                    this._isFlyoutOpen = false;
                    this._hideControls();
                },

                _initializeCustomChapterMarkers: function (mediaElement) {

                    // Remove default chapter markers
                    this._defaultChapterMarkers.length = 0;
                    var textTracks = mediaElement.textTracks;

                    var tracks = mediaElement.getElementsByTagName("track");
                    var tracksLength = tracks.length;
                    for (var i = 0; i < tracksLength; i++) {
                        if (tracks[i].kind === "chapters") {
                            // Note: We need to mark the track as "hidden" otherwise we will not receive cue-related events.
                            textTracks[i].mode = "hidden";
                            tracks[i].addEventListener("load", this._handleloadTextTrackCallbackBind, false);
                        }
                    }
                    this._isChapterMarkerVisualsDirty = true;
                },

                _initializeDefaultChapterMarkers: function () {

                    // If the chapter skip back and chapter skip forward buttons are not present or hidden then do not create the default chapter markers.
                    // Note: If the buttons are disabled, we should still create the chapter markers, because the buttons may just be temporarily disabled.
                    if ((!this._chapterSkipBackButton ||
                        this._chapterSkipBackButton.hidden) &&
                        (!this._chapterSkipForwardButton ||
                        this._chapterSkipForwardButton.hidden)) {
                        return;
                    }

                    // Remove old default chapter markers
                    this._defaultChapterMarkers.length = 0;

                    var oneTenthOfTotalTime = this._totalTime / 10;

                    // Add the 1st default chapter marker
                    this._defaultChapterMarkers.push({ time: this._startTime, type: markerType.chapter, data: {}, extraClass: "win-mediaplayer-chaptermarker" });

                    // Add default chapter markers spaced evenly every 1/10th of the media
                    var currentMarkerPosition = 0;
                    for (var i = 0; i < 9; i++) {
                        currentMarkerPosition += oneTenthOfTotalTime;
                        this._defaultChapterMarkers.push({ time: currentMarkerPosition, type: markerType.chapter, data: {}, extraClass: "win-mediaplayer-chaptermarker" });
                    }

                    // Add the last default chapter marker
                    this._defaultChapterMarkers.push({ time: this._endTime, type: markerType.chapter, data: {}, extraClass: "win-mediaplayer-chaptermarker" });

                    this._isChapterMarkerVisualsDirty = true;
                },

                _onAudioTracksCommandInvoked: function () {
                    // We don't check in the button is enabled and visible because the button won't show up unless there are audio tracks
                    if (!this._audioTracksFlyout) {
                        var flyoutElement = _Global.document.createElement("div");
                        utilities.addClass(flyoutElement, "win-mediaplayer-audiotracks");
                        utilities.addClass(flyoutElement, "win-mediaplayer-overlay");
                        this._audioTracksFlyout = new _Flyout.Flyout(flyoutElement);
                        this._audioTracksButton.type = "flyout";
                        this._audioTracksButton.flyout = this._audioTracksFlyout;
                        flyoutElement.style.display = "none";
                        _Global.document.body.appendChild(flyoutElement);
                        this._audioTracksFlyout.addEventListener("beforeshow", this._handleFlyoutOpenCallbackBind, false);
                        this._audioTracksFlyout.addEventListener("afterhide", this._handleFlyoutCloseCallbackBind, false);
                    }

                    // Show the flyout
                    if (this._audioTracksButton) {
                        this._refreshAudioTracksMenu();
                        this._audioTracksFlyout.show(this._audioTracksButton, "top");
                    }

                    this._updateUIAndRaiseEvents(mediaCommandEnum.audioTracks, strings.audioTracksMediaCommandDisplayText);
                },

                _onCastCommandInvoked: function () {
                    if (_WinRT.Windows.Media.Casting &&
                        this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        this.castButtonEnabled &&
                        this.castButtonVisible) {

                        var castingPicker = new _WinRT.Windows.Media.Casting.CastingDevicePicker();
                        castingPicker.filter.supportedCastingSources.append(this._mediaElementAdapter.mediaElement.msGetAsCastingSource());

                        var that = this;
                        castingPicker.oncastingdeviceselected = function (args) {
                            // Create the casting connection
                            var selectedCastingDevice = args.selectedCastingDevice;
                            var castingConnection = selectedCastingDevice.createCastingConnection();
                            // Begin casting
                            castingConnection.requestStartCastingAsync(that._mediaElementAdapter.mediaElement.msGetAsCastingSource());
                        };

                        var buttonRect = this._castButton.element.getBoundingClientRect();
                        castingPicker.show({ x: buttonRect.left, y: buttonRect.top, width: buttonRect.width, height: buttonRect.height }, _WinRT.Windows.UI.Popups.Placement.above);

                        this._updateUIAndRaiseEvents(mediaCommandEnum.cast, strings.castMediaCommandDisplayText);
                    }
                },

                _onCanPlay: function () {

                    this._isBusy = false;

                    if (this._startTime !== 0) {
                        this._seekInternal(this._startTime, false);

                        // Note: We need to manually call play if startTime is set otherwise a video or audio 
                        // tag with 'autoplay' set to 'true' will not delay a few seconds before starting to play
                        if (this._mediaElementAdapter &&
                            this._mediaElementAdapter.mediaElement &&
                            this._mediaElementAdapter.mediaElement.autoplay) {
                            this.play();
                        }
                    }
                },

                _onChapterSkipBackCommandInvoked: function () {
                    if (this.chapterSkipBackButtonEnabled &&
                        this.chapterSkipBackButtonVisible) {
                        this.chapterSkipBack();
                    }
                },

                _onChapterSkipForwardCommandInvoked: function () {
                    if (this.chapterSkipForwardButtonEnabled &&
                        this.chapterSkipForwardButtonVisible) {
                        this.chapterSkipForward();
                    }
                },

                _onClosedCaptionsCommandInvoked: function () {
                    // We don't check the enabled & visible status of this button because the closed captions
                    // button is only visible if there are captions.
                    if (!this._closedCaptionsFlyout) {
                        var flyoutElement = _Global.document.createElement("div");
                        utilities.addClass(flyoutElement, "win-mediaplayer-closedcaptions");
                        utilities.addClass(flyoutElement, "win-mediaplayer-overlay");
                        this._closedCaptionsFlyout = new _Flyout.Flyout(flyoutElement);
                        this._closedCaptionsButton.type = "flyout";
                        this._closedCaptionsButton.flyout = this._closedCaptionsFlyout;
                        flyoutElement.style.display = "none";
                        _Global.document.body.appendChild(flyoutElement);
                        this._closedCaptionsFlyout.addEventListener("beforeshow", this._handleFlyoutOpenCallbackBind, false);
                        this._closedCaptionsFlyout.addEventListener("afterhide", this._handleFlyoutCloseCallbackBind, false);
                    }

                    // Show the flyout
                    if (this._closedCaptionsButton) {
                        this._refreshClosedCaptionsMenu();
                        this._closedCaptionsFlyout.show(this._closedCaptionsButton, "top");
                    }

                    this._updateUIAndRaiseEvents(mediaCommandEnum.closedCaptions, strings.closedCaptionsMediaCommandDisplayText);
                },

                // Handles the back command for controller, SmartGlass, media remote and keyboard input
                // The reason we have a separate event handler for back, is because we need to intercept
                // the event before it reaches the document and navigates back. All our other key input
                // events are meant to be captured at the document level.
                _onControlsKeyupInputHandler: function (ev) {

                    if (ev.key === "GamepadB" ||
                        ev.key === "Escape") {

                        // If the controls are visible then we eat the B event so it
                        // won't bubble up to the page and cause a navigation.
                        if (this._isXboxSnapMode &&
                            this._controlsVisible) {
                            this._exitFastForwardOrRewind(true);
                            this._hideControls();
                            ev.stopPropagation();
                        }
                    }
                },

                // Toggles msZoom
                _onZoomCommandInvoked: function () {

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        this.zoomButtonEnabled &&
                        this.zoomButtonVisible) {
                        var zoomFeebackText = "";
                        if (this._mediaElementAdapter.mediaElement.msZoom) {
                            this._mediaElementAdapter.mediaElement.msZoom = false;
                            zoomFeebackText = "Letterbox";
                        } else {
                            this._mediaElementAdapter.mediaElement.msZoom = true;
                            zoomFeebackText = "Native";
                        }

                        this._updateUIAndRaiseEvents(mediaCommandEnum.zoom, zoomFeebackText);
                    }
                },

                _onDurationChange: function () {

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {

                        if (!isFinite(this._mediaElementAdapter.mediaElement.duration)) {
                            this._mediaElementAdapter.isLive = true;
                        }

                        if (!this._wasEndTimeSetProgrammatically) {
                            var newDuration = this._mediaElementAdapter.mediaElement.duration;
                            this._endTime = newDuration;
                            this._totalTime = this._endTime - this._startTime;
                            this._updateTimelineVisuals();

                            this._updateMediaState(false);
                        }
                    }
                },

                // This function is called after the video has ended.
                _onEnded: function () {

                    this._exitFastForwardOrRewind(false);

                    // Reset this value to false because there is code in _handleEndTimeReached that checks if the
                    // end time was reached or not to prevent _handleEndTimeReached from being called again.
                    this._endTimeReached = false;

                    if (this._isThumbGrabbed) {
                        this._onThumbDragStop(null);
                    }

                    this._updateMediaState(false);
                },

                // Remove old markers and clear the time display
                _onEmptied: function () {

                    this._resetInternalState();
                    this._clearTimeDisplay();
                },

                _onError: function (ev) {
                    if (!this._errorFlyout) {
                        var flyoutElement = _Global.document.createElement("div");
                        utilities.addClass(flyoutElement, "win-mediaplayer-errorflyout");
                        utilities.addClass(flyoutElement, "win-mediaplayer-overlay");
                        flyoutElement.innerHTML = '     <div class="win-mediaplayer-errortext"></div>';
                        this._errorFlyout = new _Flyout.Flyout(flyoutElement);
                        flyoutElement.style.display = "none";
                        _Global.document.body.appendChild(flyoutElement);
                        this._errorText = flyoutElement.querySelector(".win-mediaplayer-errortext");
                        this._errorFlyout.addEventListener("beforeshow", this._handleFlyoutOpenCallbackBind, false);
                        this._errorFlyout.addEventListener("afterhide", this._handleFlyoutCloseCallbackBind, false);
                    }

                    // Show the flyout
                    if (this._transportControls &&
                        this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        this._mediaElementAdapter.mediaElement.error) {
                        var error = this._mediaElementAdapter.mediaElement.error;
                        var errorText = "";
                        var mediaElement = this._mediaElementAdapter.mediaElement;
                        if (error.msExtendedErrorCode) {
                            switch (mediaElement.error.msExtendedErrorCode) {
                                case 1: // MEDIA_ERR_ABORTED
                                    errorText = strings.mediaErrorAborted;
                                    break;
                                default: // Unknown error
                                    errorText = strings.mediaErrorUnknown;
                                    break;
                            }
                        } else {
                            switch (error.code) {
                                case 1: // MEDIA_ERR_ABORTED
                                    errorText = strings.mediaErrorAborted;
                                    break;
                                case 2: // MEDIA_ERR_NETWORK
                                    errorText = strings.mediaErrorAborted;
                                    break;
                                case 3: // MEDIA_ERR_DECODE
                                    errorText = strings.mediaErrorAborted;
                                    break;
                                case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                                    errorText = strings.mediaErrorAborted;
                                    break;
                                default: // Unknown error
                                    errorText = strings.mediaErrorUnknown;
                                    break;
                            }
                        }
                        this._errorText.textContent = errorText;
                        this._errorFlyout.show(this._transportControls, "top");
                    }
                },

                _onFastForwardCommandInvoked: function () {
                    if (this.fastForwardButtonEnabled &&
                        this.fastForwardButtonVisible) {
                        this.fastForward();
                    }
                },

                // This function is called periodically during a fast forward or rewind operation. When the MediaPlayer is fast forwarding or rewinding it is actually
                // paused and cycling thumbnails to simulate a fast forward or rewind. This function updates the targetCurrentTime property and the UI on the timeline.
                _onFastForwardRewindTimerTick: function () {

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {

                        var mediaElement = this._mediaElementAdapter.mediaElement;
                        var transformName = _BaseUtils._browserStyleEquivalents["transform"].scriptName;

                        var startTime = this._startTime;
                        var endTime = this._endTime;

                        var currentTime = mediaElement.currentTime;
                        var rawElapsedTime = new Date().getTime() - this._lastFastForwardOrRewindTimerTime;
                        var elapsedTimeInSeconds = Math.floor(rawElapsedTime / 100) / 10;

                        this._fastForwardOrRewindTimerElapsedTime += elapsedTimeInSeconds * this._targetPlaybackRate;
                        this._targetCurrentTime = this._fastForwardOrRewindTimerElapsedTime + currentTime;

                        // If we are past the endTime or startTime, then we need to exit fast forward or rewind mode
                        if (this._targetCurrentTime >= endTime) {
                            this._targetCurrentTime = endTime;
                            this._handleEndTimeReached();
                        } else if (this._targetCurrentTime <= startTime) {
                            this._targetCurrentTime = startTime;
                            this._handleStartTimeReached();
                        }

                        // Note: We don't call _updateTimelineVisuals because that would sync the seek progress bar
                        // to the location of the current time, which isn't correct during a thumbnail-based fast forward or rewind.
                        if (this._progress &&
                            this._totalTime !== 0) {
                            var newProgress = (this._targetCurrentTime - startTime) / this._totalTime;
                            var newProgressLeftOffset = newProgress * this._totalSeekBarWidth;
                            if (this._thumbnailImage) {
                                // Otherwise if we're at an edge of the timeline, we move the triangle independently of the image
                                var leftEdgeOfTheSeekbar = this._thumbImageElementWidthDividedByTwo;
                                var rightEdgeOfTheSeekbar = this._totalSeekBarWidth - this._thumbImageElementWidthDividedByTwo;
                                if (newProgressLeftOffset < leftEdgeOfTheSeekbar) {
                                    var seekMarkOffset = 1 * (newProgressLeftOffset - leftEdgeOfTheSeekbar);
                                    if (seekMarkOffset < -1 * this._thumbImageElementWidthDividedByTwo) {
                                        seekMarkOffset = -1 * this._thumbImageElementWidthDividedByTwo;
                                    }
                                    this._seekMark.style[transformName] = "translateX(" + seekMarkOffset + "px)";
                                    this._thumbElement.style[transformName] = "translate(" + (seekMarkOffset) + "px, 3px)";
                                    utilities.addClass(this._thumbElement, "win-mediaplayer-thumbnail-lefttriangle");
                                    this._currentTimeVisualElements.style[transformName] = "translateX(" + leftEdgeOfTheSeekbar + "px)";
                                } else if (newProgressLeftOffset > rightEdgeOfTheSeekbar) {
                                    var seekMarkOffset = newProgressLeftOffset - rightEdgeOfTheSeekbar;
                                    if (seekMarkOffset > this._thumbImageElementWidthDividedByTwo) {
                                        seekMarkOffset = this._thumbImageElementWidthDividedByTwo;
                                    }
                                    this._seekMark.style[transformName] = "translateX(" + seekMarkOffset + "px)";
                                    this._thumbElement.style[transformName] = "translate(" + (seekMarkOffset - 14) + "px, 6px)";
                                    utilities.addClass(this._thumbElement, "win-mediaplayer-thumbnail-righttriangle");
                                    this._currentTimeVisualElements.style[transformName] = "translateX(" + rightEdgeOfTheSeekbar + "px)";
                                } else {
                                    this._seekMark.style[transformName] = "none";
                                    utilities.removeClass(this._thumbElement, "win-mediaplayer-thumbnail-lefttriangle");
                                    utilities.removeClass(this._thumbElement, "win-mediaplayer-thumbnail-righttriangle");
                                    this._thumbElement.style[transformName] = "rotate(45deg)";
                                    this._currentTimeVisualElements.style[transformName] = "translateX(" + newProgressLeftOffset + "px)";
                                }
                            }
                            this._progress.style[transformName] = "scaleX(" + newProgress + ")";

                            this._updateTimeDisplay();

                            // Request a new thumbnail and send a time update event
                            this.dispatchEvent("targettimeupdate", {});
                            if (this._thumbnailEnabled) {
                                this.dispatchEvent("thumbnailrequest", { currentTime: this._targetCurrentTime, playbackRate: this._targetPlaybackRate });
                            }
                        }

                        this._lastFastForwardOrRewindTimerTime = new Date().getTime();

                        // It's possible to get into a non-paused state, if the user starts FF or RR while a seek is in progress.
                        // The seek will finish and start the video playing, but if the user is in the FF or RR state we want
                        // the media to be paused.
                        if (this._simulatedFastForwardMode &&
                            mediaElement.playbackRate !== 0) {
                            this._previousPlaybackRate = mediaElement.playbackRate;
                            mediaElement.playbackRate = 0;
                        }
                    }
                },

                _onHideControlsCommandInvoked: function () {
                    if (this._disposed) {
                        return;
                    }

                    // If the controls are ever hidden and the MediaPlayer thinks the user is grabbing the timeline then
                    // we are in an incorrect state and need to cancel the timeline grabbing gesture. This can happen
                    // if we don't receive a pointer up event when the user opens their hand.
                    if (this._isThumbGrabbed) {
                        this._onThumbDragStop(null);
                    }

                    this._hideControls();
                },

                _onInputHandlerKeyDown: function (ev) {
                    if (this._disposed) {
                        return;
                    }

                    switch (ev.keyCode) {
                        case utilities.Key.escape:
                            if (!this._isFocusOnAVisibleFlyout() &&
                                this.isFullScreen) {
                                this.isFullScreen = false;
                            }

                            break;

                        case utilities.Key.space:
                            if (!this._isFocusOnAVisibleFlyout()) {
                                this._showControls(true);
                                this._onPlayPauseCommandInvoked();
                            }

                            break;

                        case utilities.Key.gamepadLeftShoulder:
                            if (this._isXboxSnapMode) {
                                if (!this._controlsVisible) {
                                    this._showControls();
                                }
                                this._chapterSkipBackButton.click();
                                this._playPauseButton.focus();
                            }

                            break;
                        case utilities.Key.gamepadRightShoulder:
                            if (this._isXboxSnapMode) {
                                if (!this._controlsVisible) {
                                    this._showControls();
                                }
                                this._chapterSkipForwardButton.click();
                                this._playPauseButton.focus();
                            }

                            break;
                        case utilities.Key.gamepadLeftTrigger:
                            if (this._isXboxSnapMode) {
                                if (!this._controlsVisible) {
                                    this._showControls();
                                }
                                this._rewindButton.click();
                                this._playPauseButton.focus();
                            }

                            break;
                        case utilities.Key.gamepadRightTrigger:
                            if (this._isXboxSnapMode) {
                                if (!this._controlsVisible) {
                                    this._showControls();
                                }
                                this._fastForwardButton.click();
                                this._playPauseButton.focus();
                            }

                            break;

                        default:
                            break;
                    }
                },

                _onInputHandlerKeyUp: function (ev) {
                    if (this._disposed) {
                        return;
                    }

                    switch (ev.keyCode) {
                        case utilities.Key.gamepadA:
                            if (this._isXboxSnapMode &&
                                !this._controlsVisible &&
                                !this._isFocusOnAVisibleFlyout()) {
                                this._showControls();
                                this._playPauseButton.focus();
                            }

                            break;
                        default:
                            break;
                    }
                },

                // Handles the gesture start event on the input Handler element
                _onInputHandlerPointerDown: function (ev) {
                    // Keep track of the last pointer position allows us to see if the pointer had the same X, Y on
                    // pointer up (meaning the pointer was tapped as opposed to dragged). If the pointer was tapped
                    // then we dismiss the controls.
                    if (ev.x && ev.y) {
                        this._lastPointerPosition = ev.x + "," + ev.y;
                    }

                    // When the user presses anywhere on the video if we are FF'ing or RR'ing
                    // we should exit FF or RR mode and play.
                    this._exitFastForwardOrRewind(true);

                    if (this._controlsVisible) {
                        this._onThumbStartDrag(ev);
                    } else {
                        this._showControls();
                    }
                },

                // Handles the pointer move event on the input Handler element
                _onInputHandlerPointerMove: function (ev) {
                    this._showControls();
                    if (this._isPointerDown || this._isXbox) {
                        this._onThumbDrag(ev);
                    }
                },

                // Handles click on to pause, a feature for advanced users
                _onInputHandlerClick: function (ev) {
                    // If the user clicks on the transports controls and toolbar overflow, we should not pause here, so just returns.
                    if (this._transportControls.contains(ev.target) || this._toolbar.element.contains(ev.target)) {
                        return;
                    }

                    if (!this._isXbox) {
                        this._showControls(true);
                    }
                    this._onPlayPauseCommandInvoked();
                },

                _inputHandlerMouseDown: function () {
                    this._isPointerDown = true;
                },

                _inputHandlerMouseOut: function (ev) {
                    if (this._isPointerDown &&
                        !_Global.document.hasFocus()) {
                        this._isPointerDown = false;
                        this._onThumbDragStop(ev);
                    }
                },

                _inputHandlerMouseUp: function () {
                    this._isPointerDown = false;
                },

                // Handles the gesture end event on the input Handler element
                _onInputHandlerPointerUp: function (ev) {
                    if (this._isThumbGrabbed) {
                        this._onThumbDragStop(ev);
                    }

                    var currentPointerPosition = ev.pageX + "," + ev.pageY;
                    var lastPointerPosition = this._lastPointerPosition;
                    if (currentPointerPosition === lastPointerPosition) {
                        this._hideControls();
                    }
                },

                // This function is called whenever a new media source is loaded. This function is the
                // right place to initialize any properties that get set/reset when new media is loaded.
                _onLoadStart: function () {
                    this._clearMediaCommandFeedbackText();
                    this._clearTimeDisplay();

                    if (!this._wasStartTimeSetProgrammatically &&
                        !this._wasEndTimeSetProgrammatically &&
                        !this._hasCustomMarkers) {
                        this._unsubscribeFromTimeUpdates();
                    }

                    // Remove any old markers
                    if (this._doMarkersNeedResetting) {
                        this._markers.length = 0;
                        this._hasCustomMarkers = false;
                        this._doMarkersNeedResetting = false;
                    }

                    this._isChapterMarkerVisualsDirty = true;

                    var that = this;
                    Promise.timeout(this._timeBeforeShowingBusyVisual).done(function afterEnoughTimeHasPassedToShowALoadingSpinner() {
                        if (that._mediaElementAdapter &&
                            that._mediaElementAdapter.mediaElement &&
                            that._mediaElementAdapter.mediaElement.readyState < that._MediaReadyState.MediaReadyState_Have_FutureData) {
                            that._isBusy = true;
                        }
                    });
                },

                _onLiveButtonCommandInvoked: function () {
                    if (this.goToLiveButtonEnabled &&
                        this.goToLiveButtonVisible) {
                        this.goToLive();
                    }
                },

                // This function is called when the media's metadata is loaded. This function is the right
                // place to initialize properties that need to know the duration of the media.
                _onLoadedMetadata: function () {

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {

                        if (this._mediaElementAdapter.mediaElement.duration === Number.POSITIVE_INFINITY) {
                            this._mediaElementAdapter.isLive = true;
                        }

                        var mediaElement = this._mediaElementAdapter.mediaElement;
                        this._updateDefaultStartAndEndTime(mediaElement);

                        this._initializeChapterMarkers(mediaElement);

                        // Update any dynamic button state
                        this._updateAudioTracksButtonStateBind();
                        this._updateClosedCaptionsButtonStateBind();
                    }
                },

                _onMarkerCollectionChanged: function () {

                    // The marker logic depends on the markers array always being in sorted order from smallest to largest time.
                    this._markers.sort(function (first, next) {
                        return first.time - next.time;
                    });

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {
                        this._recalculateNextAndPreviousCustomMarkerIndexAndTime(this._mediaElementAdapter.mediaElement.currentTime);
                    }

                    // We wait until the first custom marker is added before subscribing to time updates
                    // That way we won't be listening to time updates when we don't need to.
                    if (this._hasCustomMarkers) {

                        this._subscribeToTimeUpdates();
                    }

                    this._isChapterMarkerVisualsDirty = true;
                    this._updateChapterMarkerVisuals();
                },

                _onMuteCommandInvoked: function () {
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {
                        if (this._mediaElementAdapter.mediaElement.volume === 0) {
                            this._mediaElementAdapter.mediaElement.volume = this._previousVolumeValue;
                            if (this._muteButton) {
                                utilities.removeClass(this._muteButton, "win-mediaplayer-mute-icon");
                                utilities.addClass(this._muteButton, "win-mediaplayer-volume-icon");
                            }
                        } else {
                            this._previousVolumeValue = this._mediaElementAdapter.mediaElement.volume;
                            this._mediaElementAdapter.mediaElement.volume = 0;
                            if (this._muteButton) {
                                utilities.removeClass(this._muteButton, "win-mediaplayer-volume-icon");
                                utilities.addClass(this._muteButton, "win-mediaplayer-mute-icon");
                            }
                        }
                        var newVolume = this._mediaElementAdapter.mediaElement.volume * 100;
                        if (this._volumeSlider) {
                            this._volumeSlider.value = newVolume;
                        }
                        if (this._volumeValue) {
                            this._volumeValue.textContent = newVolume;
                        }
                    }
                    this._updateUIAndRaiseEvents(mediaCommandEnum.mute, strings.mediaPlayerMuteButtonLabel);
                },

                _onNextTrackCommandInvoked: function () {
                    if (this.nextTrackButtonEnabled &&
                        this.nextTrackButtonVisible) {
                        this.nextTrack();
                    }
                },

                _onPause: function () {

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:pause,StopTM");

                    this._showPlayButton();
                },

                // Note: Instead of following the typical patter where we call a public method on the MediaPlayer,
                // we handle the logic in this function. That was done, because we didn't want to expose a public API
                // called "playFromBeginning". The reason we didn't want to expose that API was because smaller API surface
                // is better and "playFromBeginning" was easily accomplished programmatically with the existing seek and play APIs.
                _onPlayFromBeginningCommandInvoked: function () {
                    if (this.playFromBeginningButtonEnabled &&
                        this.playFromBeginningButtonVisible) {
                        this._playFromBeginning();

                        this._updateUIAndRaiseEvents(mediaCommandEnum.playFromBeginning, strings.playFromBeginningMediaCommandDisplayText);
                    }
                },

                _onPlaybackRateCommandInvoked: function () {
                    if (!this._playbackRateFlyout) {
                        var flyoutElement = _Global.document.createElement("div");
                        utilities.addClass(flyoutElement, "win-mediaplayer-playbackrate");
                        utilities.addClass(flyoutElement, "win-mediaplayer-overlay");
                        flyoutElement.innerHTML = '     <button value="0.5">' + strings.playbackRateHalfSpeedLabel + '</button>' +
                                                    '     <button value="1">' + strings.playbackRateNormalSpeedLabel + '</button>' +
                                                    '     <button value="1.5">' + strings.playbackRateOneAndHalfSpeedLabel + '</button>' +
                                                    '     <button value="2">' + strings.playbackRateDoubleSpeedLabel + '</button>';
                        this._playbackRateFlyout = new _Flyout.Flyout(flyoutElement);
                        this._playbackRateButton.type = "flyout";
                        this._playbackRateButton.flyout = this._playbackRateFlyout;
                        flyoutElement.style.display = "none";
                        _Global.document.body.appendChild(flyoutElement);
                        this._playbackRateFlyout.addEventListener("beforeshow", this._handleFlyoutOpenCallbackBind, false);
                        this._playbackRateFlyout.addEventListener("afterhide", this._handleFlyoutCloseCallbackBind, false);
                        // Set up the event listeners on the buttons
                        var that = this;
                        var playbackRateOptions = flyoutElement.querySelectorAll("button");
                        for (var i = 0, len = playbackRateOptions.length; i < len; i++) {
                            playbackRateOptions[i].addEventListener("click", function (ev) {
                                if (that._mediaElementAdapter &&
                                    that._mediaElementAdapter.mediaElement) {
                                    var button = this;
                                    that._mediaElementAdapter.mediaElement.playbackRate = that._mediaElementAdapter.mediaElement.defaultPlaybackRate * button.value;
                                    ev.stopPropagation();
                                }
                            });
                        }
                    }

                    // Show the flyout
                    if (this._playbackRateButton) {
                        if (this._mediaElementAdapter &&
                            this._mediaElementAdapter.mediaElement) {
                            var currentPlaybackRate = this._mediaElementAdapter.mediaElement.playbackRate;
                            var playbackRateOptions = this._playbackRateFlyout.element.querySelectorAll("button");
                            for (var i = 0, len = playbackRateOptions.length; i < len; i++) {
                                if (playbackRateOptions[i].value === currentPlaybackRate) {
                                    utilities.addClass(playbackRateOptions[i], "win-active");
                                } else {
                                    utilities.removeClass(playbackRateOptions[i], "win-active");
                                }
                            }
                        }

                        this._playbackRateFlyout.show(this._playbackRateButton, "top");
                    }
                    this._updateUIAndRaiseEvents(mediaCommandEnum.playbackRate, strings.mediaPlayerPlaybackRateButtonLabel);
                },

                // Toggles the play / pause state of the media
                _onPlayPauseCommandInvoked: function () {

                    if ((!this._isXbox || this._controlsVisible) &&
                        this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        this.playPauseButtonEnabled &&
                        this.playPauseButtonVisible) {

                        if (this._mediaElementAdapter.mediaElement.paused) {
                            this._showPauseButton();
                            this.play();
                        } else {

                            // If we are in fast forward / rewind mode, then exit to playing
                            if (this._isInFastForwardOrRewindMode) {

                                if (!this._simulatedFastForwardMode) {
                                    this._isInFastForwardOrRewindMode = false;
                                    this._mediaElementAdapter.mediaElement.playbackRate = this._mediaElementAdapter.mediaElement.defaultPlaybackRate;
                                }

                                this._showPauseButton();
                                this.play();
                            } else {
                                this._showPlayButton();
                                this.pause();
                            }
                        }
                    }
                },

                _onPlay: function () {

                    this._showPauseButton();
                    this._updateMediaState(false);
                },

                _onPlaying: function () {

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:play,StopTM");

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {
                        if (this._mediaElementAdapter.mediaElement.playbackRate === this._mediaElementAdapter.mediaElement.defaultPlaybackRate) {
                            this._showPauseButton();
                        }

                        this._updateMediaState(false);
                    }
                },

                _onPreviousTrackCommandInvoked: function () {
                    if (this.previousTrackButtonEnabled &&
                        this.previousTrackButtonVisible) {
                        this.previousTrack();
                    }
                },

                _onProgress: function () {
                    // Update buffering visuals
                    if (this._controlsVisible &&
                        this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        (!wuiv.ApplicationView || (wuiv.ApplicationView && wuiv.ApplicationView.value !== wuiv.ApplicationViewState.snapped)) &&
                        this._mediaElementAdapter.mediaElement.buffered.length) {
                        // It is possible to have multiple buffer ranges, but we will only ever show the currently buffering range.
                        // We find the range that is closest to the current time. In most cases it'll be the latest one, so we start
                        // looking at the end and work back to the older ranges.
                        var mediaElement = this._mediaElementAdapter.mediaElement;
                        var currentTime = mediaElement.currentTime;
                        var indexOfBufferRangeToDisplay = -1;
                        var transformName = _BaseUtils._browserStyleEquivalents["transform"].scriptName;
                        for (var i = mediaElement.buffered.length - 1; i >= 0; i--) {
                            if (currentTime >= mediaElement.buffered.start(i) &&
                                currentTime <= mediaElement.buffered.end(i)) {
                                indexOfBufferRangeToDisplay = i;
                                break;
                            }
                        }

                        if (indexOfBufferRangeToDisplay !== -1) {
                            indexOfBufferRangeToDisplay = mediaElement.buffered.length - 1;
                            var bufferedStart = mediaElement.buffered.start(indexOfBufferRangeToDisplay);
                            var bufferedEnd = mediaElement.buffered.end(indexOfBufferRangeToDisplay);

                            var bufferedRangeAsPercentOfDuration = (bufferedEnd - bufferedStart) / this._totalTime;
                            var bufferPixelLeftOffset = (bufferedStart / this._totalTime) * this._totalSeekBarWidth;

                            this._buffer.style[transformName] = "scaleX(" + bufferedRangeAsPercentOfDuration + ") translateX(" + bufferPixelLeftOffset + "px)";
                        } else {
                            // Don't show buffering visuals
                            this._buffer.style[transformName] = "scaleX(" + 0 + ")";
                        }
                    }
                },

                // Handler for media elements 'ratechange' event. This function updates the UI to react to changes in playRate.
                _onRateChange: function () {
                    // We don't want to change _isInFastForwardOrRewindMode if thumbnail mode is enabled, because the actual playbackRate
                    // is not going to correspond to the perceived playbackRate in the UI.
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        !this._simulatedFastForwardMode) {
                        if (this._mediaElementAdapter.mediaElement.playbackRate === this._mediaElementAdapter.mediaElement.defaultPlaybackRate) {
                            this._isInFastForwardOrRewindMode = false;
                            this._showPauseButton();
                            this._updateInfoDisplay(strings.playMediaCommandDisplayText);
                        } else if (this._mediaElementAdapter.mediaElement.playbackRate === 0) {
                            this._isInFastForwardOrRewindMode = false;
                            this._showPlayButton();
                            this._updateInfoDisplay(strings.pauseMediaCommandDisplayText);
                        } else {
                            this._isInFastForwardOrRewindMode = true;
                            this._showPlayButton();
                            this._setFastForwardOrRewindText();
                        }

                        this._updateMediaState(false);
                    }
                },

                _onRewindCommandInvoked: function () {
                    if (this.rewindButtonEnabled &&
                        this.rewindButtonVisible) {
                        this.rewind();
                    }
                },

                _onSeeked: function () {

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:seek,StopTM");

                    // Note: We don't call _updateMediaState, because setting _isBusy calls the function
                    // under the covers.
                    this._isBusy = false;

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {

                        // Note: After a seek event, we need to recalculate the _nextMarkerTime, _nextMarkerIndex, _previousMarkerTime and _previousMarkerIndex
                        // because the current time will have changed.
                        this._recalculateNextAndPreviousCustomMarkerIndexAndTime(this._mediaElementAdapter.mediaElement.currentTime);

                        if (this._controlsVisible) {
                            // After a seek, clear any transforms on the currentTime circle visual
                            if (this._simulatedFastForwardMode) {
                                this._seekMark.style[_BaseUtils._browserStyleEquivalents["transform"].scriptName] = "none";
                            }
                            this._updateTimelineVisuals();
                        }
                    }
                },

                // This function is called before a seek operation is attempted
                _onSeeking: function () {

                    // Note: We don't call _updateMediaState, because setting _isBusy calls the function
                    // under the covers.
                    var that = this;
                    Promise.timeout(this._timeBeforeShowingBusyVisual).done(function afterEnoughTimeHasPassedToShowALoadingSpinner() {
                        if (that._mediaElementAdapter &&
                            that._mediaElementAdapter.mediaElement &&
                            that._mediaElementAdapter.mediaElement.seeking) {
                            that._isBusy = true;
                        }
                    });

                    // If there was an outside force that caused a seek operation past the starTime or endTime (for instance, 
                    // someone called seek on the video tag directly, then we need to clamp the time to the startTime or endTime.
                    if (this._wasStartTimeSetProgrammatically ||
                        this._wasEndTimeSetProgrammatically) {

                        if (this._mediaElementAdapter &&
                            this._mediaElementAdapter.mediaElement) {
                            var currentTime = this._mediaElementAdapter.mediaElement.currentTime;
                            if (currentTime < this._startTime) {
                                this._handleStartTimeReached();
                            } else if (currentTime > this._endTime) {
                                this._handleEndTimeReached();
                            }
                        }
                    }
                },

                // This function is called to show the controls when the user invokes them with voice or gesture input
                _onShowControlsCommandInvoked: function () {
                    if (this._disposed) {
                        return;
                    }

                    if ((!this._isXbox || this._isXboxSnapMode) &&
                        !this._controlsVisible &&
                        !this._isFocusOnAVisibleFlyout()) {
                        this._showControls(true, true);
                    }
                },

                // Handles the pointer move event on the input handler element when thumb bar is held down
                _onThumbDrag: function (ev) {
                    if (this._mediaElementAdapter &&
                       !this._mediaElementAdapter.isSeekAllowed && !ev.pageX) {
                        return;
                    }

                    // Calculate how far the user moved since last time & remember
                    // the current X coordinate of the pointer.
                    var newX = ev.pageX;
                    var transformName = _BaseUtils._browserStyleEquivalents["transform"].scriptName;
                    // Need to account for the Window offset
                    var seekbarRect = this._seekBar.getBoundingClientRect();
                    if (newX < seekbarRect.left) {
                        newX = seekbarRect.left;
                    } else if (newX > seekbarRect.right) {
                        newX = seekbarRect.right;
                    }

                    var seekBarOffset = newX;
                    var progress = newX / this._totalSeekBarWidth;

                    // Clamp the progress to the timeline
                    if (progress < 0) {
                        progress = 0;
                    } else if (progress > 1) {
                        progress = 1;
                    }

                    this._progress.style[transformName] = "scaleX(" + progress + ")";

                    if (this._thumbnailImage) {
                        if (seekBarOffset < 0) {
                            seekBarOffset = 0;
                        } else if (seekBarOffset > this._totalSeekBarWidth) {
                            seekBarOffset = this._totalSeekBarWidth;
                        }
                        // Otherwise if we're at an edge of the timeline, we move the triangle independently of the image
                        var leftEdgeOfTheSeekbar = 0;
                        if (this.isThumbnailEnabled) {
                            leftEdgeOfTheSeekbar = this._thumbImageElementWidthDividedByTwo;
                        } else {
                            leftEdgeOfTheSeekbar = 50; // This is 1/2 of the width of the seek time indicator visual
                        }
                        var rightEdgeOfTheSeekbar = this._totalSeekBarWidth - leftEdgeOfTheSeekbar;
                        if (seekBarOffset < leftEdgeOfTheSeekbar) {
                            var seekMarkOffset = 1 * (seekBarOffset - leftEdgeOfTheSeekbar);
                            if (seekMarkOffset < -1 * this._thumbImageElementWidthDividedByTwo) {
                                seekMarkOffset = -1 * this._thumbImageElementWidthDividedByTwo;
                            }
                            this._seekMark.style[transformName] = "translateX(" + seekMarkOffset + "px)";
                            this._thumbElement.style[transformName] = "translate(" + (seekMarkOffset) + "px, 3px)";
                            utilities.addClass(this._thumbElement, "win-mediaplayer-thumbnail-lefttriangle");
                            this._currentTimeVisualElements.style[transformName] = "translateX(" + leftEdgeOfTheSeekbar + "px)";
                        } else if (seekBarOffset > rightEdgeOfTheSeekbar) {
                            var seekMarkOffset = seekBarOffset - rightEdgeOfTheSeekbar;
                            if (seekMarkOffset > this._thumbImageElementWidthDividedByTwo) {
                                seekMarkOffset = this._thumbImageElementWidthDividedByTwo;
                            }
                            this._seekMark.style[transformName] = "translateX(" + seekMarkOffset + "px)";
                            this._thumbElement.style[transformName] = "translate(" + (seekMarkOffset - 14) + "px, 6px)";
                            utilities.addClass(this._thumbElement, "win-mediaplayer-thumbnail-righttriangle");
                            this._currentTimeVisualElements.style[transformName] = "translateX(" + rightEdgeOfTheSeekbar + "px)";
                        } else {
                            this._seekMark.style[transformName] = "none";
                            this._thumbElement.style[transformName] = "rotate(45deg)";
                            utilities.removeClass(this._thumbElement, "win-mediaplayer-thumbnail-righttriangle");
                            utilities.removeClass(this._thumbElement, "win-mediaplayer-thumbnail-lefttriangle");
                            this._currentTimeVisualElements.style[transformName] = "translateX(" + seekBarOffset + "px)";
                        }
                    }

                    this._seekCurrentTime = progress * this._totalTime;

                    // Clamp the currentTime
                    if (this._seekCurrentTime < 0) {
                        this._seekCurrentTime = 0;
                    } else if (this._seekCurrentTime > this._totalTime) {
                        this._seekCurrentTime = this._totalTime;
                    }

                    // Apply a slight magnetism so that is the user is scrubbing close to a marker the timeline
                    // position will snap to the marker.
                    if (this._markers.length &&
                        (this._lastPosition - newX) < this._MINIMUM_POINTER_DELTA_TO_ENABLE_SNAPPING_TO_NEAREST_MARKER &&
                        this.chapterSkipBackButtonEnabled &&
                        this.chapterSkipBackButtonVisible &&
                        this.chapterSkipForwardButtonEnabled &&
                        this.chapterSkipForwardButtonVisible) {
                        var closeToMarkerThreshold = this._totalTime * this._SNAP_TO_NEAREST_MARKER_THRESHOLD;
                        for (var i = 0, len = this._markers.length; i < len; i++) {
                            if (Math.abs(this._markers[i].time - this._seekCurrentTime) < closeToMarkerThreshold) {

                                // Snap the currentTime to the marker
                                this._seekCurrentTime = this._markers[i].time;
                                var markerOffset = this._seekCurrentTime / this._totalTime;

                                // Snap the UI to the marker location
                                this._progress.style[transformName] = "scaleX(" + markerOffset + "px)";
                                this._currentTimeVisualElements.style[transformName] = "translateX(" + markerOffset + "px)";

                                break;
                            }
                        }
                    }

                    this.dispatchEvent("thumbnailrequest", { currentTime: this._seekCurrentTime, playbackRate: 0 });

                    if (this._thumbnailImage) {
                        this._seekTimeIndicator.textContent = this._timeFormatter(this._seekCurrentTime);
                    }

                    this._lastPosition = newX;
                },

                // Handles the pointer up event on the seek bar thumb
                _onThumbDragStop: function (ev) {

                    if (this._mediaElementAdapter &&
                       !this._mediaElementAdapter.isSeekAllowed) {
                        return;
                    }

                    // Show the buttons again
                    utilities.removeClass(this._transportControls, "win-invisible");

                    var mediaElement = this._mediaElementAdapter.mediaElement;
                    var transformName = _BaseUtils._browserStyleEquivalents["transform"].scriptName;

                    // Hide the cursor while the user is scrubbing
                    if (_WinRT.Windows.Xbox) {
                        _WinRT.Windows.Xbox.Input.InputManager.systemCursorVisibility = _WinRT.Windows.Xbox.Input.SystemCursorVisibility.visible;
                    }

                    if (this._thumbnailImage) {
                        utilities.addClass(this._thumbElement, "win-mediaplayer-hidden");
                        utilities.addClass(this._thumbnailImage, "win-mediaplayer-hidden");

                        this._seekMark.style[transformName] = "none";
                        this._thumbElement.style[transformName] = "rotate(45deg)";
                    }

                    utilities.removeClass(this._element, "win-mediaplayer-scrubbing");

                    // We need to check if the video is loaded before seeking otherwise the video tag will throw an exception.
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        this._mediaElementAdapter.mediaElement.readyState >= this._MediaReadyState.MediaReadyState_Have_FutureData) {
                        this.seek(this._seekCurrentTime);
                    }

                    this._mediaElementAdapter.mediaElement.playbackRate = this._previousPlaybackRate;
                    if (!this._wasPausedBeforeScrubbing &&
                        !mediaElement.ended) {
                        this._mediaElementAdapter.play();
                    }
                    this._setControlsTimer();

                    this._isThumbGrabbed = false;
                },

                // Handles the pointer down event on the seek bar thumb 
                _onThumbStartDrag: function (ev) {
                    if (!this._mediaElementAdapter ||
                        !this._mediaElementAdapter.isSeekAllowed ||
                        !this._mediaElementAdapter.mediaElement) {
                        return;
                    }

                    if (this._controlsVisible) {
                        var mediaElement = this._mediaElementAdapter.mediaElement;
                        this._wasPausedBeforeScrubbing = mediaElement.paused;

                        // Disable the auto-hide timer on the controls while scrubbing
                        if (this._controlHideTimeout) {
                            this._removeControlsTimer();
                        }

                        // Only do this for video otherwise this will stop audio playback
                        // during scrubbing which is undesirable.
                        if (mediaElement.tagName === this._TAG_NAME_VIDEO) {
                            this._mediaElementAdapter.pause();
                            this._previousPlaybackRate = this._mediaElementAdapter.mediaElement.playbackRate;
                            this._mediaElementAdapter.mediaElement.playbackRate = 0;
                        }

                        // This is the initial position of the cursor before the user has started
                        // a scrub operation. This value will be mapped to the current timeline position.
                        this._startOffsetX = ev.x;
                        this._lastPosition = this._startOffsetX;

                        // Hide the control so -ms-attraction doesn't cause the cursor to jump up & down
                        utilities.addClass(this._transportControls, "win-invisible");

                        // Need to also calculate the offset of the timeline
                        var currentTime = this._mediaElementAdapter.mediaElement.currentTime;
                        this._relativeTimelineStartOffset = currentTime / this._totalTime;

                        this._isThumbGrabbed = true;

                        // Hide the cursor while the user is scrubbing
                        if (_WinRT.Windows.Xbox) {
                            _WinRT.Windows.Xbox.Input.InputManager.systemCursorVisibility = _WinRT.Windows.Xbox.Input.SystemCursorVisibility.hidden;
                        }

                        // Show the thumbnails if thumbnail mode is enabled
                        if (this._thumbnailImage) {
                            utilities.removeClass(this._thumbElement, "win-mediaplayer-hidden");
                            utilities.removeClass(this._thumbnailImage, "win-mediaplayer-hidden");

                            // We need this value for scrubbing to make sure the thumbnail image doesn't go past the timeline.
                            if (!this._thumbImageElementWidthDividedByTwo) {
                                this._thumbImageElementWidthDividedByTwo = this._thumbnailImage.clientWidth / 2;
                            }
                        }

                        utilities.addClass(this._element, "win-mediaplayer-scrubbing");
                    }
                },

                _onTimeSkipForwardCommandInvoked: function () {
                    if (this.timeSkipForwardButtonEnabled &&
                        this.timeSkipForwardButtonVisible) {
                        this.timeSkipForward();
                    }
                },

                _onTimeSkipBackCommandInvoked: function () {
                    if (this.timeSkipBackButtonEnabled &&
                        this.timeSkipBackButtonVisible) {
                        this.timeSkipBack();
                    }
                },

                // This function is called approximately every 200 milliseconds.
                // This function should only be called if (1) the timeline controls are visible or (2) there are custom markers
                _onTimeUpdate: function () {
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {

                        // If current time has passed the start or end time, then we clamp the current time to the start or end time.
                        var currentTime = this._mediaElementAdapter.mediaElement.currentTime;
                        if (this._mediaElementAdapter.mediaElement.readyState >= this._MediaReadyState.MediaReadyState_Have_FutureData) {
                            if (currentTime < this._startTime) {
                                this._handleStartTimeReached();
                            } else if (currentTime > this._endTime) {
                                this._handleEndTimeReached();
                            }
                        }

                        // Check Fire marker event if there is one
                        if (this._nextCustomMarkerTime !== -1 &&
                            !this._isInFastForwardOrRewindMode &&
                            Math.abs(this._nextCustomMarkerTime - currentTime) < this._MARKER_PROXIMITY_THRESHOLD) {

                            // We need to check that there is still a valid marker to fire an event on, otherwise we
                            // could run into a race condition where the markers was removed in between us capturing
                            // the currentTime and firing the event.
                            if (this._markers[this._nextCustomMarkerIndex]) {
                                this.dispatchEvent("markerreached", this._markers[this._nextCustomMarkerIndex]);
                            }

                            // It's possible that there are more markers in close proximity to the current marker
                            // we need to fire those markers as well, otherwise they will get skipped over by the
                            // next 'timeupdate', since 'timeupdate' fires only about every 200 milliseconds.
                            var markersLength = this._markers.length;
                            var indexOfLastMarkerFired = this._nextCustomMarkerIndex;
                            for (var i = indexOfLastMarkerFired + 1; i < markersLength; i++) {
                                if ((this._markers[i].time - currentTime) < this._MARKER_PROXIMITY_THRESHOLD) {

                                    // We do not need to check to see if the marker is valid before firing the event like
                                    // we did above, because we already check the validity of the markers in the for loop
                                    // with this statement "this._markers[i].time".
                                    this.dispatchEvent("markerreached", this._markers[i]);
                                    indexOfLastMarkerFired = i;
                                } else {
                                    break;
                                }
                            }

                            // Reset the next/previous marker state variables
                            if (indexOfLastMarkerFired + 1 < this._markers.length &&
                                this._markers[indexOfLastMarkerFired + 1]) {
                                this._nextCustomMarkerIndex = indexOfLastMarkerFired + 1;
                                this._nextCustomMarkerTime = this._markers[this._nextCustomMarkerIndex].time;
                            } else {
                                this._nextCustomMarkerIndex = -1;
                                this._nextCustomMarkerTime = -1;
                            }

                            if (indexOfLastMarkerFired >= 0 &&
                                this._markers.length &&
                                this._markers[indexOfLastMarkerFired]) {
                                this._previousCustomMarkerIndex = indexOfLastMarkerFired;
                                this._previousCustomMarkerTime = this._markers[this._previousCustomMarkerIndex].time;
                            } else {
                                this._previousCustomMarkerIndex = -1;
                                this._previousCustomMarkerTime = -1;
                            }

                        }

                        if (this._mediaElementAdapter &&
                            this._controlsVisible) {

                            // Update the time display for non-live streams
                            if (!this._mediaElementAdapter.isLive) {
                                this._syncTimeAndProgress(false);
                                this._updateTimeDisplay();
                            }
                        }
                    }
                },

                _onToggleFullscreenCommandInvoked: function () {
                    if (this.isFullScreen) {
                        this.isFullScreen = false;
                    } else {
                        this.isFullScreen = true;
                    }
                },

                _onStopCommandInvoked: function () {
                    if (this.stopButtonEnabled &&
                        this.stopButtonVisible) {
                        this.stop();
                    }
                },

                _onVolumeCommandInvoked: function () {
                    if (!this._volumeFlyout) {
                        var flyoutElement = _Global.document.createElement("div");
                        utilities.addClass(flyoutElement, "win-mediaplayer-volume");
                        utilities.addClass(flyoutElement, "win-mediaplayer-overlay");
                        flyoutElement.innerHTML = '     <div class="win-mediaplayer-volume-heading">Speakers</div>' +
                                                    '     <div class="win-mediaplayer-volume-controls">' +
                                                    '       <button class="win-mediaplayer-mutebutton"></button>' +
                                                    '       <input class=" win-slider win-mediaplayer-volume-slider" type="range" />' +
                                                    '       <div class="win-mediaplayer-volume-value"></div>' +
                                                    '     </div>';
                        this._volumeFlyout = new _Flyout.Flyout(flyoutElement);
                        this._volumeButton.type = "flyout";
                        this._volumeButton.flyout = this._volumeFlyout;
                        flyoutElement.style.display = "none";
                        _Global.document.body.appendChild(flyoutElement);

                        this._muteButton = flyoutElement.querySelector(".win-mediaplayer-mutebutton");
                        if (this._muteButton) {
                            if (this._mediaElementAdapter.mediaElement.volume === 0) {
                                utilities.addClass(this._muteButton, "win-mediaplayer-mute-icon");
                            } else {
                                utilities.addClass(this._muteButton, "win-mediaplayer-volume-icon");
                            }
                        }
                        this._volumeSlider = flyoutElement.querySelector(".win-mediaplayer-volume-slider");
                        this._volumeValue = flyoutElement.querySelector(".win-mediaplayer-volume-value");

                        // Attach overlay event handlers
                        this._volumeFlyout.addEventListener("aftershow", this._handleVolumeFlyoutShowCallback, false);
                        this._volumeFlyout.addEventListener("beforeshow", this._handleFlyoutOpenCallbackBind, false);
                        this._volumeFlyout.addEventListener("afterhide", this._handleFlyoutCloseCallbackBind, false);
                        this._volumeSlider.addEventListener("change", this._handleVolumeSliderChangeCallback, false);
                        this._addButtonEventHandler(this._muteButton, "click", this._onMuteCommandInvoked);
                    }

                    // Show the flyout
                    if (this._volumeButton) {
                        this._volumeFlyout.show(this._volumeButton, "top");
                    }

                    this._updateUIAndRaiseEvents(mediaCommandEnum.volume, strings.mediaPlayerVolumeButtonLabel);
                },

                _playFromBeginning: function () {

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:_playFromBeginning,StartTM");

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {

                        var mediaElement = this._mediaElementAdapter.mediaElement;
                        if (mediaElement.ended) {
                            mediaElement.load();
                        }

                        if (mediaElement.currentTime !== this._startTime &&
                            mediaElement.readyState >= this._MediaReadyState.MediaReadyState_Have_FutureData) {
                            this._seekInternal(this._startTime, false);
                            mediaElement.playbackRate = mediaElement.defaultPlaybackRate;
                            this._mediaElementAdapter.play();

                            this._endTimeReached = false;
                        }

                        this._updateUIAndRaiseEvents(mediaCommandEnum.playFromBeginning, strings.replayMediaCommandDisplayText);
                    }
                },

                // Recalculate the index of the next custom marker based on the current time
                _recalculateNextAndPreviousCustomMarkerIndexAndTime: function (currentTime) {

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:_recalculateNextAndPreviousCustomMarkerIndexAndTime,StartTM");

                    var markersLength = this._markers.length;
                    var previousCustomMarkerIndexAndTimeSet = false;
                    var nextCustomMarkerIndexAndTimeSet = false;
                    for (var i = 0; i < markersLength; i++) {

                        if (previousCustomMarkerIndexAndTimeSet &&
                            nextCustomMarkerIndexAndTimeSet) {
                            return;
                        }

                        if (!nextCustomMarkerIndexAndTimeSet &&
                            this._markers[i].time >= currentTime) {
                            this._nextCustomMarkerIndex = i;
                            this._nextCustomMarkerTime = this._markers[i].time;

                            nextCustomMarkerIndexAndTimeSet = true;
                        }
                        if (!previousCustomMarkerIndexAndTimeSet &&
                            this._markers[i].time <= currentTime) {
                            this._previousCustomMarkerIndex = i;
                            this._previousCustomMarkerTime = this._markers[i].time;

                            previousCustomMarkerIndexAndTimeSet = true;
                        }
                    }

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:_recalculateNextAndPreviousCustomMarkerIndexAndTime,StopTM");
                },

                // Get sizes for the UI elements used for seeking logic.
                _recalculateCachedUIElementSizes: function () {
                    Scheduler.schedule(function () {
                        if (this._disposed) {
                            return;
                        }

                        this._totalSeekBarWidth = this._seekBar.clientWidth;
                        this._seekBarLeftOffset = this._seekBar.offsetLeft;
                        this._thumbElementWidthDividedByTwo = this._thumbElement.clientWidth / 2;
                        this._thumbImageElementWidthDividedByTwo = this._thumbnailImage.clientWidth / 2;
                    }, Scheduler.Priority.normal, this, "WinJS.UI.MediaPlayer._recalculateCachedUIElementSizes");
                },

                _refreshAudioTracksMenu: function () {
                    // Programmatically remove all old buttons
                    var oldButtons = this._audioTracksFlyout.element.querySelectorAll("button");
                    for (var i = 0, len = oldButtons.length; i < len; i++) {
                        oldButtons[i].parentNode.removeChild(oldButtons[i]);
                    }
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        this._mediaElementAdapter.mediaElement.audioTracks) {
                        var audioTracks = this._mediaElementAdapter.mediaElement.audioTracks;
                        for (var i = 0, len = audioTracks.length; i < len; i++) {
                            var currentTrack = audioTracks[i];
                            var audioTrackOption = _Global.document.createElement("button");
                            audioTrackOption.textContent = currentTrack.label || currentTrack.language;
                            if (_WinRT.Windows.Globalization.Language && !currentTrack.label) {
                                var language = new _WinRT.Windows.Globalization.Language(currentTrack.language);
                                audioTrackOption.textContent = language.displayName;
                            }
                            if (currentTrack.enabled) {
                                utilities.addClass(audioTrackOption, "win-active");
                            }
                            audioTrackOption.addEventListener("click", (function generatedClickHandler(metadata) {
                                return function handleClick() {
                                    if (metadata &&
                                        !metadata.enabled) {
                                        metadata.enabled = true;
                                        this._refreshAudioTracksMenu();
                                    }
                                }.bind(this);
                            }.bind(this))(currentTrack));
                            this._audioTracksFlyout.element.appendChild(audioTrackOption);
                        }
                    }
                },

                _refreshClosedCaptionsMenu: function () {
                    // Programmatically remove all old buttons
                    var oldButtons = this._closedCaptionsFlyout.element.querySelectorAll("button");
                    for (var i = 0, len = oldButtons.length; i < len; i++) {
                        oldButtons[i].parentNode.removeChild(oldButtons[i]);
                    }
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        this._mediaElementAdapter.mediaElement.textTracks) {
                        var textTracks = this._mediaElementAdapter.mediaElement.textTracks;

                        for (var i = 0, len = textTracks.length; i < len; i++) {
                            var currentTrack = textTracks[i];
                            if (currentTrack.kind === "captions" ||
                                currentTrack.kind === "subtitles") {
                                var closedCaptionsOption = _Global.document.createElement("button");
                                closedCaptionsOption.textContent = currentTrack.label;
                                if (currentTrack.mode === "showing") {
                                    utilities.addClass(closedCaptionsOption, "win-active");
                                    closedCaptionsOption.textContent += " " + strings.mediaPlayerOverlayActiveOptionIndicator;
                                } else if (currentTrack.mode === "hidden") {
                                    utilities.addClass(closedCaptionsOption, "win-mediaplayer-hidden");
                                }
                                closedCaptionsOption.addEventListener("click", (function generatedClickHandler(currentTrack, i) {
                                    return function handleClick() {
                                        this._setActiveTextTrack(i);
                                    }.bind(this);
                                }.bind(this))(currentTrack, i));
                                this._closedCaptionsFlyout.element.appendChild(closedCaptionsOption);
                            }
                        }

                        // Create the menu option for turning closed captions off entirely
                        var closedCaptionsOption = _Global.document.createElement("button");
                        closedCaptionsOption.textContent = strings.closedCaptionsLabelNone;
                        closedCaptionsOption.addEventListener("click", function handleClick() {
                            this._setActiveTextTrack(null);
                        }.bind(this));
                        this._closedCaptionsFlyout.element.appendChild(closedCaptionsOption);
                    }
                },

                _removeButtonEventHandlers: function () {

                    if (this._buttonEventSubscriptions) {
                        for (var i = 0; i < this._buttonEventSubscriptions.length; i++) {
                            var button = this._buttonEventSubscriptions[i].button;
                            var eventName = this._buttonEventSubscriptions[i].eventName;
                            var handler = this._buttonEventSubscriptions[i].handler;
                            button.removeEventListener(eventName, handler);
                        }

                        this._buttonEventSubscriptions = [];
                    }
                },

                // Remove the auto hide timer for hiding controls
                _removeControlsTimer: function () {

                    if (this._controlHideTimeout) {
                        _Global.clearTimeout(this._controlHideTimeout);
                        this._controlHideTimeout = null;
                    }
                },

                _removeGestureEventHandlers: function () {

                    if (this._gestureEventSubscriptions) {
                        for (var i = 0; i < this._gestureEventSubscriptions.length; i++) {
                            var owner = this._gestureEventSubscriptions[i].owner;
                            var eventName = this._gestureEventSubscriptions[i].eventName;
                            var handler = this._gestureEventSubscriptions[i].handler;
                            owner.removeEventListener(eventName, handler);
                        }

                        this._gestureEventSubscriptions = [];
                    }
                },

                // Reset the auto hide timer of the controls if available
                _resetAutoHideControlsTimer: function () {

                    if (this._controlHideTimeout) {
                        var that = this;

                        _Global.clearTimeout(this._controlHideTimeout);

                        this._controlHideTimeout = _Global.setTimeout(function () {
                            that._hideControls();
                        }, this._CONTROLS_AUTO_HIDE_DURATION);
                    }
                },

                // Resets both the controls timer 
                _resetAutoHideTimers: function () {

                    this._resetAutoHideControlsTimer();
                },

                // This function should be called whenever the media source changes
                _resetInternalState: function () {

                    this._isBusy = false;
                    this._isChapterMarkerVisualsDirty = false;
                    this._doesEndTimeNeedResetting = true;
                    this._doesStartTimeNeedResetting = true;
                    this._doMarkersNeedResetting = true;
                    this._defaultChapterMarkers = [];
                    this._endTime = 0;
                    this._endTimeReached = false;
                    this._hasCustomMarkers = false;
                    this._lastFastForwardOrRewindTimerTime = 0;
                    this._fastForwardOrRewindTimerElapsedTime = 0;
                    this._isInFastForwardOrRewindMode = false;
                    this._nextCustomMarkerIndex = -1;
                    this._nextCustomMarkerTime = -1;
                    this._previousCustomMarkerIndex = -1;
                    this._previousCustomMarkerTime = -1;
                    this._startTime = 0;
                    this._targetPlaybackRate = 0;
                    this._targetCurrentTime = 0;
                    this._totalTimeInternal = 0;
                    this._wasStartTimeSetProgrammatically = false;
                    this._wasEndTimeSetProgrammatically = false;
                    this._wasTimeClampedToEndTime = false;

                    // Reset the progress bar
                    this._progress.style[_BaseUtils._browserStyleEquivalents["transform"].scriptName] = "scaleX(0)";
                },

                _seekInternal: function (newTime, wasCalledProgrammatically) {

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.seek &&
                        this._mediaElementAdapter.isSeekAllowed) {

                        this._exitFastForwardOrRewind(true);

                        if (newTime < this._startTime) {
                            newTime = this._startTime;
                        } else if (newTime > this._endTime) {
                            newTime = this._endTime;
                        }

                        if (this._mediaElementAdapter.isLive) {
                            if (newTime > this._liveTime) {
                                newTime = this._liveTime;
                            } else if (newTime > this._endTime) {
                                newTime = this._endTime;
                            }
                        }

                        // Checking if the seek time is a valid number saves us from possible crashes. Also, if it was a user initiated
                        // seek, then we check to make sure the MediaElement is in a valid state & can seek without throwing an exception.
                        // Note: we don't perform this check if the developer calls seek programmatically, because hiding the exception and
                        // failing silently would create hard to track down bugs for the developer.
                        if (!isNaN(newTime) &&
                           (wasCalledProgrammatically ||
                           (!wasCalledProgrammatically &&
                            this._mediaElementAdapter &&
                            this._mediaElementAdapter.mediaElement &&
                            this._mediaElementAdapter.mediaElement.readyState >= this._MediaReadyState.MediaReadyState_Have_FutureData))) {
                            this._mediaElementAdapter.seek(newTime);
                        }

                        if (wasCalledProgrammatically) {
                            this._updateUIAndRaiseEvents(mediaCommandEnum.seek, null);
                        }
                    }
                },

                _setActiveTextTrack: function (index) {
                    var closedCaptionsOptions = this._closedCaptionsFlyout.element.querySelectorAll("button");
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        this._mediaElementAdapter.mediaElement.textTracks) {
                        var textTracks = this._mediaElementAdapter.mediaElement.textTracks;
                        for (var i = 0, len = textTracks.length; i < len; i++) {
                            var currentTrack = textTracks[i];
                            var correspondingClosedCaptionsOption = closedCaptionsOptions[i];
                            correspondingClosedCaptionsOption.textContent = currentTrack.label;
                            if (i === index) {
                                currentTrack.mode = "showing";
                                utilities.addClass(correspondingClosedCaptionsOption, "win-active");
                                correspondingClosedCaptionsOption.textContent += " " + strings.mediaPlayerOverlayActiveOptionIndicator;
                            } else {
                                textTracks[i].mode = "hidden";
                                utilities.removeClass(correspondingClosedCaptionsOption, "win-active");
                            }
                        }
                    }
                },

                // Start an auto hide timer for hiding controls
                _setControlsTimer: function () {

                    var that = this;
                    this._controlHideTimeout = _Global.setTimeout(function () {
                        that._hideControls();
                    }, this._CONTROLS_AUTO_HIDE_DURATION);
                    this._lastControlsResetTimeStamp = Date.now();
                },

                _setFastForwardOrRewindText: function () {

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {
                        var currentPlaybackRate = this._PLAYBACKRATE_NOT_PLAYING;

                        if (this._simulatedFastForwardMode) {
                            currentPlaybackRate = this._targetPlaybackRate;
                        } else {
                            currentPlaybackRate = this._mediaElementAdapter.mediaElement.playbackRate;
                        }

                        var playbackSpeedText = "";
                        var mediaCommand = "";
                        if (currentPlaybackRate >= this._PLAYBACKRATE_FAST_FORWARD_2X) {
                            var fastForwardAmount = Math.floor(currentPlaybackRate / this._mediaElementAdapter.mediaElement.defaultPlaybackRate);
                            mediaCommand = mediaCommandEnum.fastForward;
                            playbackSpeedText = _Resources._formatString(strings.fastForwardFeedbackDisplayText, fastForwardAmount);
                        } else if (currentPlaybackRate <= this._PLAYBACKRATE_REWIND_2X) {
                            var rewindAmount = Math.floor(currentPlaybackRate / (-1 * this._mediaElementAdapter.mediaElement.defaultPlaybackRate));
                            mediaCommand = mediaCommandEnum.rewind;
                            playbackSpeedText = _Resources._formatString(strings.rewindFeedbackDisplayText, rewindAmount);
                        } else if (currentPlaybackRate === this._PLAYBACKRATE_FAST_FORWARD_SLOW_MOTION_RATE) {
                            mediaCommand = mediaCommandEnum.fastForward;
                            playbackSpeedText = strings.fastForwardFeedbackSlowMotionDisplayText;
                        } else if (currentPlaybackRate === this._PLAYBACKRATE_REWIND_SLOW_MOTION_RATE) {
                            mediaCommand = mediaCommandEnum.rewind;
                            playbackSpeedText = strings.rewindFeedbackSlowMotionDisplayText;
                        } else {
                            mediaCommand = mediaCommandEnum.play;
                            playbackSpeedText = strings.playMediaCommandDisplayText;
                        }

                        this._playbackSpeedIndicator.textContent = playbackSpeedText;
                        this.dispatchEvent("mediacommandexecuted", { mediaCommand: mediaCommand });
                        this._updateMediaState(false);
                    }
                },

                _setupNewMediaElement: function (newMediaElement, oldMediaElement) {

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:_setupNewMediaElement,StartTM");

                    // If there's an old mediaElement, we need to remove event listeners and CSS classes from it
                    if (oldMediaElement) {
                        this._resetInternalState();
                        this._unsubscribeFromMediaEvents(oldMediaElement);
                        utilities.removeClass(oldMediaElement, "win-mediaplayer-video");
                    }

                    // Add the new mediaElement to the tree
                    if (newMediaElement &&
                        this._element) {

                        // Make sure it's not showing controls
                        newMediaElement.controls = false;
                        utilities.addClass(newMediaElement, "win-mediaplayer-video");

                        // The following adds the appropriate classes based on whether 
                        // we're full screen or not
                        if (this._fullScreen) {
                            this.isFullScreen = true;
                        } else {
                            this.isFullScreen = false;
                            utilities.addClass(this.element, "win-focusable");
                        }

                        this._recalculateCachedUIElementSizes();
                        var elementToInsertMediaElementBefore = null;
                        elementToInsertMediaElementBefore = this._element.querySelector(".win-mediaplayer-controls");
                       
                        if (elementToInsertMediaElementBefore &&
                            elementToInsertMediaElementBefore.parentNode &&
                            !this._isTestMode) { // The last clause is added for testing so we don't have to have an actual DOM element when running unit tests
                            elementToInsertMediaElementBefore.parentNode.insertBefore(newMediaElement, elementToInsertMediaElementBefore);
                        }

                        if (newMediaElement) {

                            if (newMediaElement.tagName === this._TAG_NAME_AUDIO) {
                                if (this._smtControls) {
                                    this._smtControls.displayUpdater.type = _WinRT.Windows.Media.MediaPlaybackType.audio;
                                }
                            } else {
                                if (this._smtControls) {
                                    this._smtControls.displayUpdater.type = _WinRT.Windows.Media.MediaPlaybackType.video;
                                }
                            }

                            // If the new media element is already loaded, we need to update MediaPlayer properties
                            if (newMediaElement.readyState > this._MediaReadyState.MediaReadyState_Have_Metadata) {
                                this._updateDefaultStartAndEndTime(newMediaElement);
                            }

                            if (this._controlsVisible) {
                                this._subscribeToTimeUpdates();
                            }

                            // Update timeline
                            this._updateTimelineVisuals();
                        }
                    }

                    // Set initial button state
                    if (newMediaElement) {
                        if (newMediaElement.paused) {
                            this._showPlayButton();
                        } else {
                            this._showPauseButton();
                        }
                    }

                    // If the video has already loaded it's metadata, then we need to set the startTime, endTime, and clear markers
                    if (newMediaElement &&
                        newMediaElement.readyState >= this._MediaReadyState.MediaReadyState_Have_FutureData) {

                        if (oldMediaElement) {
                            this._doesEndTimeNeedResetting = false;
                            this._doesStartTimeNeedResetting = false;
                            this._doMarkersNeedResetting = false;
                        }

                        this._updateDefaultStartAndEndTime(newMediaElement);

                        if (!this._wasEndTimeSetProgrammatically) {
                            this._totalTime = newMediaElement.duration - this._startTime;
                            this._updateTimelineVisuals();
                        }

                        // We need to clear any existing markers, so that _initializeChapterMarkers does
                        // not think that the developer already specified chapter markers when they did not.
                        this._markers.length = 0;
                        this._initializeChapterMarkers(newMediaElement);
                    } else {
                        if (oldMediaElement) {
                            this._doesEndTimeNeedResetting = true;
                            this._doesStartTimeNeedResetting = true;
                            this._doMarkersNeedResetting = true;
                        }
                    }

                    // We do not need to check if the newMediaElement is null, because one of the sub-functions
                    // in this._subscribeToMediaEvents will do that check.
                    this._subscribeToMediaEvents(newMediaElement);

                    if (this._smtControls) {
                        this._smtControls.isNextEnabled = (this.chapterSkipForwardButtonEnabled && this.chapterSkipForwardButtonVisible) || (this.nextTrackButtonEnabled && this.nextTrackButtonVisible);
                        this._smtControls.isPreviousEnabled = (this.chapterSkipBackButtonEnabled && this.chapterSkipBackButtonVisible) || (this.previousTrackButtonEnabled && this.previousTrackButtonVisible);
                    }

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:_setupNewMediaElement,StopTM");
                },

                // Show the controls bar, controls bar will slide/fade in, but will auto hide automatically.
                // force tried to alway show controls irrespective playback happening or not.
                _showControls: function (force, doNotAutoHide) {

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:_showControls,StartTM");

                    if ((this._controlsVisible ||
                        this._isXboxSnapMode &&
                        !force) ||
                        this._disposed) {
                        return;
                    }

                    if (!this._totalSeekBarWidth) {
                        this._totalSeekBarWidth = this._seekBar.clientWidth;
                        this._seekBarLeftOffset = this._seekBar.offsetLeft;
                        this._thumbElementWidthDividedByTwo = this._thumbElement.clientWidth / 2;
                        this._thumbImageElementWidthDividedByTwo = this._thumbnailImage.clientWidth / 2;
                    }

                    // Only show the controls if we actually playing back something
                    if ((this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        this._mediaElementAdapter.mediaElement.currentSrc) ||
                        force) {

                        var defaultNotPrevented = this._dispatchCancellableEvent("beforeshowcontrols", {});

                        if (defaultNotPrevented) {
                            utilities.removeClass(this._controls, "win-mediaplayer-hidden");
                            this._controlsVisible = true;
                            this._updateChapterMarkerVisuals();

                            // We hide the back button for all platforms except the desktop and tablet where there is no hardware
                            // back button or well-known convention for the back button (eg. pressing B on Xbox)
                            if (nav.canGoBack &&
                               !_WinRT.Windows.Xbox) {
                                utilities.removeClass(this._backButton.element, "win-mediaplayer-hidden");
                            }

                            if (this._controlHideTimeout) {
                                this._removeControlsTimer();
                            }

                            this._transportControls.style.opacity = 1;

                            // Visible transport bar buttons
                            var visibleAllTransportBarButtons = [];
                            // Grab all the buttons
                            var allTransportBarButtons = this._transportControls.querySelectorAll("button");
                            for (var i = 0, len = allTransportBarButtons.length; i < len; i++) {
                                var currentButton = allTransportBarButtons[i];
                                if (currentButton.winControl && !currentButton.winControl.hidden) {
                                    visibleAllTransportBarButtons.push(allTransportBarButtons[i]);
                                }
                            }
                            // Need toolbar layout once during first
                            if (!this._isToolbarResized) {
                                this._toolbar.forceLayout();
                                this._isToolbarResized = true;
                            }

                            var that = this;
                            Animations._mediaPlayerShowControlsAnimation({
                                skipAnimations: this._skipAnimations,
                                compact: this._compact,
                                progressContainer: this._progressContainer,
                                mediacontrols: this._controls,
                                visibleTransportBarButtons: visibleAllTransportBarButtons
                            }).then(function () {
                                if (that._disposed) {
                                    return;
                                }
                                _WriteProfilerMark("WinJS.UI.MediaPlayer:_showControls,StopTM");
                                that.dispatchEvent("aftershowcontrols", {});
                            });

                            if ((!wuiv.ApplicationView ||
                                (wuiv.ApplicationView && wuiv.ApplicationView.value !== wuiv.ApplicationViewState.snapped)) &&
                                !this._isInFastForwardOrRewindMode &&
                                !doNotAutoHide) {
                                this._setControlsTimer();
                            }

                            // Subscribe to media position change events again
                            this._subscribeToTimeUpdates();

                            this._updateTimelineVisuals();
                        }
                    }
                },

                _playHideControlsAnimation: function () {
                    if (this._skipAnimations) {
                        return Promise.wrap();
                    }

                    // Grab all the buttons
                    var allTransportBarButtons = this._transportControls.querySelectorAll("button");
                    var visibleTransportBarButtons = [];
                    for (var i = 0, len = allTransportBarButtons.length; i < len; i++) {
                        var currentButton = allTransportBarButtons[i];
                        if (currentButton.winControl && !currentButton.winControl.hidden) {
                            visibleTransportBarButtons.push(allTransportBarButtons[i]);
                        }
                    }

                    var animationPromises = [];
                    // Do an animation on them
                    animationPromises.push(_TransitionAnimation.executeAnimation(visibleTransportBarButtons, [{
                        property: _BaseUtils._browserStyleEquivalents["transform"].cssName,
                        delay: 0,
                        duration: 333,
                        timing: "cubic-bezier(0.71, 0.01, 0.84, 0)",
                        from: "none",
                        to: "translateY(100px)"
                    }]));

                    // Animate the timeline
                    animationPromises.push(_TransitionAnimation.executeAnimation(this._progressContainer, [{
                        property: _BaseUtils._browserStyleEquivalents["transform"].cssName,
                        delay: 0,
                        duration: 333,
                        timing: "cubic-bezier(0.71, 0.01, 0.84, 0)",
                        from: "none",
                        to: "translateY(100px)"
                    }]));

                    animationPromises.push(_TransitionAnimation.executeTransition(this._controls, [{
                        property: "opacity",
                        delay: 0,
                        duration: 333,
                        timing: "linear",
                        from: 1,
                        to: 0
                    }]));

                    return Promise.join(animationPromises);
                },

                _startFastForwardOrRewind: function () {

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.pause &&
                        this._mediaElementAdapter.mediaElement) {

                        // Set the playbackRate to zero & pause the video
                        this._previousPlaybackRate = this._mediaElementAdapter.mediaElement.playbackRate;
                        this._mediaElementAdapter.mediaElement.playbackRate = 0;
                        this._mediaElementAdapter.pause();

                        // Start the fastForwardAndRewind timer
                        this._fastForwardOrRewindTimerElapsedTime = 0;
                        this._lastFastForwardOrRewindTimerTime = new Date().getTime();

                        var that = this;
                        this._onFastForwardRewindTimerTick();
                        this._fastForwardOrRewindTimer = _Global.setInterval(function () { that._onFastForwardRewindTimerTick(); }, this._FAST_FORWARD_OR_REWIND_TIMER_INTERVAL);

                        // Show the thumbnails if thumbnail mode is enabled
                        if (this._thumbnailImage) {
                            utilities.removeClass(this._thumbElement, "win-mediaplayer-hidden");
                            utilities.removeClass(this._thumbnailImage, "win-mediaplayer-hidden");

                            if (this._targetPlaybackRate === 0 ||
                                this._targetPlaybackRate === 1) {
                                utilities.removeClass(this._element, "win-mediaplayer-scrubbing");
                                utilities.removeClass(this._element, "win-mediaplayer-rewind");
                                utilities.removeClass(this._element, "win-mediaplayer-fastforward");
                            } else if (this._targetPlaybackRate > 0) {
                                utilities.removeClass(this._element, "win-mediaplayer-scrubbing");
                                utilities.removeClass(this._element, "win-mediaplayer-rewind");
                                utilities.addClass(this._element, "win-mediaplayer-fastforward");
                            } else if (this._targetPlaybackRate < 0) {
                                utilities.removeClass(this._element, "win-mediaplayer-scrubbing");
                                utilities.removeClass(this._element, "win-mediaplayer-fastforward");
                                utilities.addClass(this._element, "win-mediaplayer-rewind");
                            }

                            // We need this value for scrubbing to make sure the thumbnail image doesn't go past the timeline.
                            if (!this._thumbImageElementWidthDividedByTwo) {
                                this._thumbImageElementWidthDividedByTwo = this._thumbnailImage.clientWidth / 2;
                            }
                        }

                        this._isInFastForwardOrRewindMode = true;

                        // If we are starting a new FF or RR operation we need to set this variable to false, otherwise
                        // the user will be unable to FF all the way to the end.
                        this._wasTimeClampedToEndTime = false;
                    }
                },

                // Turns the playpause toggle button into a pause button
                _showPauseButton: function () {
                    this._playPauseButton.icon = _Icon.pause;
                    if (this._smtControls) {
                        this._smtControls.isPauseEnabled = true;
                        this._smtControls.isPlayEnabled = false;
                    }
                },

                // Turns the playpause toggle button into a play button
                _showPlayButton: function () {
                    this._playPauseButton.icon = _Icon.play;
                    if (this._smtControls) {
                        this._smtControls.isPauseEnabled = false;
                        this._smtControls.isPlayEnabled = true;
                    }
                },

                // Subscribes to the 'timeupdate' event
                _subscribeToTimeUpdates: function () {

                    // Make sure there is only one 'timeupdate' event ever, so we remove it first every time
                    var that = this;
                    this._unsubscribeFromTimeUpdates();
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {
                        this._addMediaEventListener(this._mediaElementAdapter.mediaElement, "timeupdate", function () {
                            that._onTimeUpdate();
                        });
                    }
                },

                _subscribeToMediaEvents: function (mediaElement) {

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:_subscribeToMediaEvents,StartTM");

                    var that = this;

                    this._addMediaEventListener(mediaElement, "addtrack", function () {
                        that._updateAudioTracksButtonStateBind();
                        that._updateClosedCaptionsButtonStateBind();
                    });

                    this._addMediaEventListener(mediaElement, "canplay", function () {
                        that._onCanPlay();
                    });

                    this._addMediaEventListener(mediaElement, "change", function () {
                        that._updateAudioTracksButtonStateBind();
                        that._updateClosedCaptionsButtonStateBind();
                    });

                    this._addMediaEventListener(mediaElement, "durationchange", function () {
                        that._onDurationChange();
                    });

                    this._addMediaEventListener(mediaElement, "emptied", function () {
                        that._onEmptied();
                    });

                    this._addMediaEventListener(mediaElement, "ended", function () {
                        that._onEnded();
                    });

                    this._addMediaEventListener(mediaElement, "error", function (ev) {
                        that._onError(ev);
                    });

                    this._addMediaEventListener(mediaElement, "loadstart", function () {
                        that._onLoadStart();
                    });

                    this._addMediaEventListener(mediaElement, "loadedmetadata", function () {
                        that._onLoadedMetadata();
                    });

                    this._addMediaEventListener(mediaElement, "pause", function () {
                        that._onPause();
                    });

                    this._addMediaEventListener(mediaElement, "play", function () {
                        that._onPlay();
                    });

                    this._addMediaEventListener(mediaElement, "playing", function () {
                        that._onPlaying();
                    });

                    this._addMediaEventListener(mediaElement, "progress", function () {
                        that._onProgress();
                    });

                    this._addMediaEventListener(mediaElement, "ratechange", function () {
                        that._onRateChange();
                    });

                    this._addMediaEventListener(mediaElement, "removetrack", function () {
                        that._updateAudioTracksButtonStateBind();
                        that._updateClosedCaptionsButtonStateBind();
                    });

                    this._addMediaEventListener(mediaElement, "seeked", function () {
                        that._onSeeked();
                    });

                    this._addMediaEventListener(mediaElement, "seeking", function () {
                        that._onSeeking();
                    });

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:_subscribeToMediaEvents,StopTM");
                },

                // Updates the seek bar position to match the current media play time
                _syncTimeAndProgress: function (force) {

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        (!wuiv.ApplicationView || (wuiv.ApplicationView && wuiv.ApplicationView.value !== wuiv.ApplicationViewState.snapped))) {

                        var mediaElement = this._mediaElementAdapter.mediaElement;
                        var startTime = this._startTime;
                        var endTime = this._endTime;
                        var currentTime = mediaElement.currentTime - startTime;
                        var transformName = _BaseUtils._browserStyleEquivalents["transform"].scriptName;

                        var progress = 0;
                        if (!this._mediaElementAdapter.mediaElement.paused || force) {
                            if (!this._isThumbGrabbed &&
                                !this._isInFastForwardOrRewindMode &&
                                (force || this._controlsVisible)) {

                                if (!this._totalSeekBarWidth &&
                                    this._seekBar.clientWidth) {
                                    this._totalSeekBarWidth = this._seekBar.clientWidth;
                                }
                                progress = currentTime / this._totalTime;
                                var amountToMoveSeekVisuals = progress * this._totalSeekBarWidth;
                                this._currentTimeVisualElements.style[transformName] = "translateX(" + amountToMoveSeekVisuals + "px)";
                            }

                            if (currentTime > endTime) {
                                currentTime = endTime;
                            }

                            if (this._progress &&
                                !this._isThumbGrabbed) {
                                if (this._totalTime !== 0) {
                                    this._progress.style[transformName] = "scaleX(" + progress + ")";
                                } else {
                                    // If the totalTime is zero (this typically happens while the video is buffering for the 1st time)
                                    // then instead of showing a full progress bar (0/0) we show an empty one.
                                    this._progress.style[transformName] = "scaleX(0)";
                                }
                            }
                        }
                    }
                },

                _timelineClickHandler: function (ev) {
                    var newPosition = (ev.x / this._totalSeekBarWidth) * this._totalTime;
                    this._seekInternal(newPosition);
                },

                // Unsubscribe from previously subscribed media events
                _unsubscribeFromMediaEvents: function (mediaElement) {

                    if (mediaElement) {
                        var mediaEventSubscriptionsLength = this._mediaEventSubscriptions.length;
                        for (var i = 0; i < mediaEventSubscriptionsLength; i++) {
                            mediaElement.removeEventListener(this._mediaEventSubscriptions[i].eventName, this._mediaEventSubscriptions[i].handler);
                        }
                    }

                    this._mediaEventSubscriptions = [];
                },

                // Unsubscribe a specific media event
                _unsubscribeFromMediaEvent: function (eventName) {

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {
                        var mediaEventSubscriptionsLength = this._mediaEventSubscriptions.length;
                        for (var i = 0, len = mediaEventSubscriptionsLength; i < len; i++) {
                            var otherEventName = this._mediaEventSubscriptions[i].eventName;
                            if (eventName === otherEventName) {
                                this._mediaElementAdapter.mediaElement.removeEventListener(otherEventName, this._mediaEventSubscriptions[i].handler);
                                this._mediaEventSubscriptions.splice(i, 1);
                                break;
                            }
                        }
                    }
                },

                // Unsubscribe to "timeupdate" events from MPT
                _unsubscribeFromTimeUpdates: function () {

                    if (!this._hasCustomMarkers &&
                        !this._controlsVisible) {
                        this._unsubscribeFromMediaEvent("timeupdate");
                    }
                },

                _updateAudioTracksButtonState: function () {
                    // If there are any text tracks then enable and show the audio tracks button
                    var hasAtLeastTwoAudioTracksTrack = false;
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        this._mediaElementAdapter.mediaElement.audioTracks &&
                        this._mediaElementAdapter.mediaElement.audioTracks.length > 1) {
                        hasAtLeastTwoAudioTracksTrack = true;
                    }
                    this._audioTracksButton.hidden = !hasAtLeastTwoAudioTracksTrack;
                },

                // This method actually updates all marker visuals, not just chapter marker visuals
                _updateChapterMarkerVisuals: function () {

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:_updateChapterMarkerVisuals,StartTM");

                    if (this._isChapterMarkerVisualsDirty) {

                        var markers = null;
                        if (this._defaultChapterMarkers.length) {
                            markers = this._markers.concat(this._defaultChapterMarkers);
                        } else {
                            markers = this._markers;
                        }

                        // Remove existing markers from the timeline
                        if (this._seekBar.parentNode) {
                            var oldMarkers = this._seekBar.parentNode.querySelectorAll(".win-mediaplayer-marker");
                            var oldMarkersLength = oldMarkers.length;
                            for (var i = 0; i < oldMarkersLength; i++) {
                                oldMarkers[i].parentNode.removeChild(oldMarkers[i]);
                            }
                        }

                        // Add markers to the timeline
                        var currentMarkerTime = null;
                        var markersLength = markers.length;
                        for (var i = 0; i < markersLength; i++) {

                            currentMarkerTime = markers[i].time;
                            // Note: We check if currentMarkerTime is 'null' rather than checking "if (currentMarkerTime)", 
                            // because currentMarkerTime with a value of zero is valid.
                            if (markers[i].extraClass &&
                                typeof currentMarkerTime === "number") {

                                // The totalSeekBarWidth is sometimes calculated when controls are shown for the 1st time.
                                // That means it is possible that the seek bar width has not been calculated and we need to calculate it.
                                if (!this._totalSeekBarWidth) {
                                    this._totalSeekBarWidth = this._seekBar.clientWidth;
                                    this._thumbElementWidthDividedByTwo = this._thumbElement.clientWidth / 2;
                                    this._thumbImageElementWidthDividedByTwo = this._thumbnailImage.clientWidth / 2;
                                }

                                // Create a DOM element for each marker
                                var marker = _Global.document.createElement("div");
                                marker.id = "ms__marker" + (currentMarkerTime.toString()).replace(".", "_");
                                utilities.addClass(marker, "win-mediaplayer-marker ");
                                utilities.addClass(marker, markers[i].extraClass);

                                var percentageTime = currentMarkerTime / this._totalTime;
                                var currentTimeLeftOffset = percentageTime * this._totalSeekBarWidth;
                                marker.style.marginLeft = currentTimeLeftOffset + "px";

                                if (this._seekBar.parentNode) {
                                    this._seekBar.parentNode.insertBefore(marker, this._seekBar.nextElementSibling);
                                }
                            }
                        }

                        // If the total width of the seekbar is zero (meaning it hasn't been calculated), then
                        // we need to leave _isChapterMarkerVisualsDirty as true, otherwise all markers will have
                        // a position of zero on the timeline.
                        this._isChapterMarkerVisualsDirty = (this._totalSeekBarWidth === 0);
                    }

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:_updateChapterMarkerVisuals,StopTM");
                },

                _updateClosedCaptionsButtonState: function () {
                    // If there are any text tracks then enable and show the closed captions button
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        this._mediaElementAdapter.mediaElement.textTracks) {
                        var hasAtLeastOneCaptionsTrack = false;
                        var textTracks = this._mediaElementAdapter.mediaElement.textTracks;
                        for (var i = 0, len = textTracks.length; i < len; i++) {
                            var currentTrack = textTracks[i];
                            if (currentTrack.kind === "captions" ||
                                currentTrack.kind === "subtitles") {
                                hasAtLeastOneCaptionsTrack = true;
                                break;
                            }
                        }
                        this._closedCaptionsButton.hidden = !hasAtLeastOneCaptionsTrack;
                    }
                },

                _updateDefaultStartAndEndTime: function (mediaElement) {

                    // Note: We are not worried that by calling 'this.startTime = ' rather than 'this._endTime' we will
                    // set _wasStartTimeSetProgrammatically to 'true' incorrectly, because we reset those values to false later in the function. 
                    if (!this._wasStartTimeSetProgrammatically) {
                        this._startTime = mediaElement.initialTime || 0;

                        // Reset default chapter markers
                        if (this._defaultChapterMarkers.length) {
                            this._initializeDefaultChapterMarkers();
                        }

                        // Update the time display
                        this._updateTimelineVisuals();
                    }
                    if (!this._wasEndTimeSetProgrammatically) {
                        this._endTime = mediaElement.duration;

                        // Reset default chapter markers
                        if (this._defaultChapterMarkers.length) {
                            this._initializeDefaultChapterMarkers();
                        }

                        // Update the time display
                        this._updateTimelineVisuals();
                    }

                    // Note: We need to reset these values because when a new media src is loaded
                    // we don't care if someone previously set startTime or endTime programmatically.
                    // Since it is a new src, we want these values to be clean.
                    if (this._doesStartTimeNeedResetting) {
                        this._wasStartTimeSetProgrammatically = false;
                    }
                    if (this._doesEndTimeNeedResetting) {
                        this._wasEndTimeSetProgrammatically = false;
                    }

                    this._updateTimeDisplay();
                },

                // When the DOM for the MediaPlayer changes, call this function to re-attach event listeners
                _initializeDomElements: function () {

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:_initializeDomElements,StartTM");

                    this._removeButtonEventHandlers();

                    var mediaPlaybackContent = this._element.querySelector(".win-mediaplayer");
                    if (!mediaPlaybackContent) {
                        mediaPlaybackContent = _Global.document.createElement("div");
                        utilities.addClass(mediaPlaybackContent, "win-mediaplayer");
                    }

                    // Query for any developer-added custom buttons. The reason we do this before setting the MediaPlayer's innerHTML
                    // is because if we querySelector for all the WinJS.UI.Command objects we'll get the developer added buttons in
                    // addition to the built in ones.
                    this._customButtons = this._element.querySelectorAll("[data-win-control='WinJS.UI.Command']");

                    mediaPlaybackContent.innerHTML = this._mediaPlayerHtml;
                    this._element.appendChild(mediaPlaybackContent);

                    // Get references to all the UI elements
                    this._buffer = this._element.querySelector(".win-mediaplayer-buffer");
                    this._busyIndicator = this._element.querySelector(".win-mediaplayer-busy");
                    this._controls = this._element.querySelector(".win-mediaplayer-controls");
                    this._currentTimeIndicator = this._element.querySelector(".win-mediaplayer-currenttimeindicator");
                    this._currentTimeVisualElements = this._element.querySelector(".win-mediaplayer-seekbarvisualelements-container");
                    this._inputHandlerElement = this._element.querySelector(".win-mediaplayer-inputhandler");
                    this._mediaCommandFeedbackText = this._element.querySelector(".win-mediaplayer-inputfeedback");
                    this._mediaPlayerContainer = this._element.querySelector(".win-mediaplayer-container");
                    this._playbackSpeedIndicator = this._element.querySelector(".win-mediaplayer-playbackspeedindicator");
                    this._progress = this._element.querySelector(".win-mediaplayer-seekprogress");
                    this._progressContainer = this._element.querySelector(".win-mediaplayer-progresscontainer");
                    this._metadataTitle = this._element.querySelector(".win-mediaplayer-mediatitle");
                    this._metadataDescription = this._element.querySelector(".win-mediaplayer-mediadescription");
                    this._seekBar = this._element.querySelector(".win-mediaplayer-seekbar");
                    this._seekMark = this._element.querySelector(".win-mediaplayer-seek-mark");
                    this._seekWindowLeftEdgeElement = this._element.querySelector(".win-mediaplayer-seek-leftboundary");
                    this._seekWindowRightEdgeElement = this._element.querySelector(".win-mediaplayer-seek-rightboundary");
                    this._seekTimeIndicator = this._element.querySelector(".win-mediaplayer-seektimeindicator");
                    this._thumbnailImage = this._element.querySelector(".win-mediaplayer-thumbnail");
                    this._thumbnailImageVisual = this._element.querySelector(".win-mediaplayer-thumbnailvisual");
                    this._thumbElement = this._element.querySelector(".win-mediaplayer-thumb");
                    this._timeline = this._element.querySelector(".win-mediaplayer-timeline");
                    this._timeRemainingIndicator = this._element.querySelector(".win-mediaplayer-timeremainingindicator");
                    this._toolbarElement = this._element.querySelector(".win-mediaplayer-commands");
                    this._totalTimeIndicator = this._element.querySelector(".win-mediaplayer-totaltimeindicator");
                    this._transportControls = this._element.querySelector(".win-mediaplayer-transportcontrols");
                    this._snappedOverlay = this._element.querySelector(".win-mediaplayer-snapped-overlay");

                    // Construct the MediaPlayer button programmatically so it's synchronous
                    this._toolbar = new _ToolBar.ToolBar(this._toolbarElement);
                    this._toolbar.closedDisplayMode = _ToolBar.ToolBar.ClosedDisplayMode.full;
                    utilities.addClass(this._toolbar.element, "win-mediaplayer-toolbar");
                    // temporary till this one fixed
                    // https://github.com/winjs/winjs/issues/1100
                    this._toolbarResizeCallback = function handleResize() {
                        if (that._disposed) {
                            return;
                        }
                        // Re-Layoout the toolbar
                        that.forceLayout();
                    };
                    _ElementUtilities._resizeNotifier.subscribe(this._toolbar, this._toolbarResizeCallback);
                    this._handleFlyoutOpenCallbackBind = this._handleFlyoutOpenCallback.bind(this);
                    this._handleFlyoutCloseCallbackBind = this._handleFlyoutCloseCallback.bind(this);
                    this._toolbar.addEventListener("beforeopen", this._handleFlyoutOpenCallbackBind, false);
                    this._toolbar.addEventListener("afterclose", this._handleFlyoutCloseCallbackBind, false);
                    this._initializeTransportBarButtons();
                    var that = this;
                    // Note: the order the buttons are created in code will be the order they show up in the UI.
                    if (this._transportControls) {
                        // Create back button
                        this._backButton = new BackButton.BackButton();
                        this._busyIndicator.parentNode.insertBefore(this._backButton.element, this._busyIndicator);
                        utilities.addClass(this._backButton.element, "win-mediaplayer-hidden");

                        // Logic so that using directional navigation and click will reset the auto-hide timer.
                        this._handleTransportBarButtonFocus = function transportBarButtonFocusHandler(ev) {
                            that._resetAutoHideTimers();
                        };
                        this._handleTransportBarButtonClick = function transportBarButtonClickHandler(ev) {
                            that._resetAutoHideTimers();
                        };

                        // Because we don't key click events on gamepadA
                        this._handleTransportBarButtonKeyDown = function transportBarButtonKeyDownHandler(ev) {
                            if (ev.key === "GamepadA") {
                                utilities.addClass(ev.target, "win-mediaplayer-transportbarbutton-active");
                            }
                        };
                        this._handleTransportBarButtonKeyUp = function transportBarButtonKeyUpHandler(ev) {
                            if (ev.key === "GamepadA") {
                                utilities.removeClass(ev.target, "win-mediaplayer-transportbarbutton-active");
                            }
                        };
                    }

                    // Note: the order the buttons are created in code will be the order they show up in the UI.
                    if (this._toolbar) {
                        // Primary transport bar buttons
                        this._chapterSkipBackButton = this._toolbar.getCommandById("win-mediaplayer-chapterskipback");
                        this._subscribeControlsEvents(this._chapterSkipBackButton);
                        this._chapterSkipForwardButton = this._toolbar.getCommandById("win-mediaplayer-chapterskipforward");
                        this._subscribeControlsEvents(this._chapterSkipForwardButton);
                        this._fastForwardButton = this._toolbar.getCommandById("win-mediaplayer-fastforward");
                        this._subscribeControlsEvents(this._fastForwardButton);
                        this._nextTrackButton = this._toolbar.getCommandById("win-mediaplayer-nexttrack");
                        this._subscribeControlsEvents(this._nextTrackButton);
                        this._playFromBeginningButton = this._toolbar.getCommandById("win-mediaplayer-playfrombeginning");
                        this._subscribeControlsEvents(this._playFromBeginningButton);
                        this._playPauseButton = this._toolbar.getCommandById("win-mediaplayer-playpause");
                        this._subscribeControlsEvents(this._playPauseButton);
                        this._playbackRateButton = this._toolbar.getCommandById("win-mediaplayer-playbackrate");
                        this._subscribeControlsEvents(this._playbackRateButton);
                        this._previousTrackButton = this._toolbar.getCommandById("win-mediaplayer-previoustrack");
                        this._subscribeControlsEvents(this._previousTrackButton);
                        this._rewindButton = this._toolbar.getCommandById("win-mediaplayer-rewind");
                        this._subscribeControlsEvents(this._rewindButton);
                        this._stopButton = this._toolbar.getCommandById("win-mediaplayer-stop");
                        this._subscribeControlsEvents(this._stopButton);
                        this._timeSkipBackButton = this._toolbar.getCommandById("win-mediaplayer-timeskipback");
                        this._subscribeControlsEvents(this._timeSkipBackButton);
                        this._timeSkipForwardButton = this._toolbar.getCommandById("win-mediaplayer-timeskipforward");
                        this._subscribeControlsEvents(this._timeSkipForwardButton);

                        // Secondary transport bar buttons
                        this._audioTracksButton = this._toolbar.getCommandById("win-mediaplayer-audiotracks");
                        this._subscribeControlsEvents(this._audioTracksButton);
                        this._closedCaptionsButton = this._toolbar.getCommandById("win-mediaplayer-closedcaptions");
                        this._subscribeControlsEvents(this._closedCaptionsButton);
                        this._goToLiveButton = this._toolbar.getCommandById("win-mediaplayer-live");
                        this._subscribeControlsEvents(this._goToLiveButton);
                        this._toggleFullScreenButton = this._toolbar.getCommandById("win-mediaplayer-fullscreen");
                        this._subscribeControlsEvents(this._toggleFullScreenButton);
                        this._castButton = this._toolbar.getCommandById("win-mediaplayer-playonremotedevice");
                        this._subscribeControlsEvents(this._castButton);
                        this._volumeButton = this._toolbar.getCommandById("win-mediaplayer-volume");
                        this._subscribeControlsEvents(this._volumeButton);
                        this._zoomButton = this._toolbar.getCommandById("win-mediaplayer-zoom");
                        this._subscribeControlsEvents(this._zoomButton);
                    }

                    this._inputHandlerPointerDownCallback = this._onInputHandlerPointerDown.bind(this);
                    this._inputHandlerPointerMoveCallback = this._onInputHandlerPointerMove.bind(this);
                    this._inputHandlerPointerUpCallback = this._onInputHandlerPointerUp.bind(this);
                    this._inputHandlerClickCallback = this._onInputHandlerClick.bind(this);
                    this._inputHandlerMouseDownCallback = this._inputHandlerMouseDown.bind(this);
                    this._inputHandlerMouseOutCallback = this._inputHandlerMouseOut.bind(this);
                    this._inputHandlerMouseUpCallback = this._inputHandlerMouseUp.bind(this);

                    this._handleVolumeFlyoutShowCallback = this._handleVolumeFlyoutShow.bind(this);
                    this._handleVolumeSliderChangeCallback = this._handleVolumeSliderChange.bind(this);

                    // Register for gesture events
                    if (this._gestureRecognizer) {
                        this._addGestureEventHandler(this._gestureRecognizer, 'manipulationstarted', this._handleManipulationStarted);
                        this._addGestureEventHandler(this._gestureRecognizer, 'manipulationupdated', this._handleManipulationUpdated);
                        this._addGestureEventHandler(this._gestureRecognizer, 'manipulationcompleted', this._handleManipulationCompleted);
                        this._addGestureEventHandler(this._gestureRecognizer, 'manipulationend', this._handleManipulationEnd);
                    }

                    // The following events feed pointer input to the gesture recognizer
                    if (this._isXbox) {
                        this._addGestureEventHandler(this._inputHandlerElement, "click", this._inputHandlerClickCallback);
                        this._addGestureEventHandler(this._inputHandlerElement, "pointerdown", this._handlePointerDown);
                        this._addGestureEventHandler(this._inputHandlerElement, "pointerhover", this._handlePointerHover);
                        this._addGestureEventHandler(this._inputHandlerElement, "pointermove", this._handlePointerMove);
                        this._addGestureEventHandler(this._inputHandlerElement, "pointerup", this._handlePointerUp);
                    } else {
                        this._addGestureEventHandler(this._mediaPlayerContainer, "click", this._inputHandlerClickCallback);
                        this._addGestureEventHandler(this._progressContainer, "pointerdown", this._inputHandlerPointerDownCallback);
                        this._addGestureEventHandler(this._progressContainer, "pointerover", this._handlePointerHover);
                        _ElementUtilities._globalListener.addEventListener(this.element, "pointermove", this._inputHandlerPointerMoveCallback);
                        _ElementUtilities._globalListener.addEventListener(this.element, "pointerup", this._inputHandlerMouseUpCallback);
                        this._addGestureEventHandler(this._progressContainer, "pointerup", this._inputHandlerPointerUpCallback);

                        this._addGestureEventHandler(this._progressContainer, "pointerdown", this._inputHandlerMouseDownCallback);
                        utilities._documentListener.addEventListener(this.element, "pointerout", this._inputHandlerMouseOutCallback);
                        
                    }

                    // Listen for clicks on the seek bar
                    this._addGestureEventHandler(this._progressContainer, "click", this._timelineClickHandler);

                    // For accessibility we listen for arrow keys on the timeline
                    this._timeline.addEventListener("keydown", this._handleTimelineArrowKeyDownBind, false);

                    this._element.addEventListener("keyup", this._controlsKeyupInputHandler, false);

                    _Res.processAll(this._element);

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:_initializeDomElements,StopTM");

                },

                _subscribeControlsEvents: function (buttonElement) {
                    if (buttonElement) {
                        this._addButtonEventHandler(buttonElement, "focus", this._handleTransportBarButtonFocus);
                        this._addButtonEventHandler(buttonElement, "click", this._handleTransportBarButtonClick);
                        this._addButtonEventHandler(buttonElement, "keydown", this._handleTransportBarButtonKeyDown);
                        this._addButtonEventHandler(buttonElement, "keyup", this._handleTransportBarButtonKeyUp);
                    }
                },

                _updateFastForwardAndRewindState: function (oldPlaybackRate, newPlaybackRate) {

                    if (!this._isFastForwardOrRewind(oldPlaybackRate) &&
                        this._isFastForwardOrRewind(newPlaybackRate)) {
                        this._startFastForwardOrRewind();
                    } else if (this._isFastForwardOrRewind(oldPlaybackRate) &&
                               !this._isFastForwardOrRewind(newPlaybackRate)) {
                        this._exitFastForwardOrRewind(true);
                    } else {
                        // Do nothing
                    }

                    this.dispatchEvent("targetratechange", {});
                    this._updateMediaState(false);
                },

                _updateInfoDisplay: function (mediaCommand) {

                    this._mediaCommandFeedbackText.textContent = mediaCommand;
                },

                // This function updates the state of the SystemMediaTarnsportControls
                _updateMediaState: function (isStopped) {

                    // Return if we are running in an iframe or not on an Xbox
                    if (!wuiv.ApplicationView ||
                        !_WinRT.Windows.Xbox ||
                        !this._smtControls) {
                        return;
                    }

                    var numberOfMilisecondsInASecond = 1000;
                    var playbackStatus = _WinRT.Windows.Media.MediaPlaybackStatus;
                    var updater = this._smtControls.displayUpdater;

                    // We need to set the contentId on every update because there could be cases where there are multiple
                    // concurrent videos. Because there is only one smtc, the two videos will override each other's state.
                    // For SmartGlass to be able to differentiate between the two video streams, we need to send the contentId
                    // along with each update.
                    if (updater &&
                        this._mediaMetadata) {
                        updater.appMediaId = this._mediaMetadata.contentId;
                    }

                    // Assign MediaTransportState
                    if (!this._mediaElementAdapter ||
                        !this._mediaElementAdapter.mediaElement ||
                        !this._mediaElementAdapter.mediaElement.src) {
                        this._smtControls.playbackStatus = playbackStatus.closed;
                    } else if (isStopped ||
                        this._mediaElementAdapter.mediaElement.ended) {
                        this._smtControls.playbackStatus = playbackStatus.stopped;
                    } else if (this._isBusy) {
                        if (this._mediaElementAdapter.mediaElement.readyState <= this._MediaReadyState.MediaReadyState_Have_FutureData) {
                            this._smtControls.playbackStatus = playbackStatus.changing;
                        }
                    } else if (!this._isInFastForwardOrRewindMode) {
                        if (this._mediaElementAdapter.mediaElement.paused) {
                            this._smtControls.playbackStatus = playbackStatus.paused;
                        } else {
                            this._smtControls.playbackStatus = playbackStatus.playing;
                        }
                    } else if (this._isInFastForwardOrRewindMode) {
                        this._smtControls.playbackStatus = playbackStatus.playing;
                    } else {
                        this._smtControls.playbackStatus = playbackStatus.closed;
                    }

                    this._smtControls.isFastForwardEnabled = this.fastForwardButtonEnabled && this.fastForwardButtonVisible;
                    this._smtControls.isNextEnabled = (this.chapterSkipForwardButtonEnabled && this.chapterSkipForwardButtonVisible) || (this.nextTrackButtonEnabled && this.nextTrackButtonVisible);

                    if (this.playPauseButtonEnabled && this.playPauseButtonVisible) {
                        if (this._mediaElementAdapter &&
                            this._mediaElementAdapter.mediaElement) {

                            if (this._mediaElementAdapter.mediaElement.paused) {
                                this._smtControls.isPlayEnabled = true;
                                this._smtControls.isPauseEnabled = false;
                            } else {
                                this._smtControls.isPlayEnabled = false;
                                this._smtControls.isPauseEnabled = true;
                            }
                        }
                    }

                    this._smtControls.isPreviousEnabled = (this.chapterSkipBackButtonEnabled && this.chapterSkipBackButtonVisible) || (this.previousTrackButtonEnabled && this.previousTrackButtonVisible);
                    this._smtControls.isRewindEnabled = this.rewindButtonEnabled && this.rewindButtonVisible;
                    this._smtControls.isStopEnabled = this.stopButtonEnabled && this.stopButtonVisible;

                    // Note: The duration is NaN before the video stream has loaded it's metadata, which will cause
                    // the MediaPlayer to fall into "live" mode. We need to check the state of the mediaElement to
                    // make sure that metadata is loaded before setting isLive to true.
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        !isFinite(this._mediaElementAdapter.mediaElement.duration) &&
                        this._mediaElementAdapter.mediaElement.readyState > this._MediaReadyState.MediaReadyState_Have_Metadata) {
                        this._mediaElementAdapter.isLive = true;
                    }

                    if (updater.type === _WinRT.Windows.Media.MediaPlaybackType.video) {
                        updater.videoProperties.mediaStart = 0;
                        if (this._mediaElementAdapter &&
                            this._mediaElementAdapter.isSeekAllowed) {
                            if (isFinite(this._startTime)) {
                                updater.videoProperties.minSeek = this._startTime * numberOfMilisecondsInASecond;
                            }
                            // We use -1 to indicate to the SystemMediaTransportControl that the
                            // media represents a live event
                            if (this._mediaElementAdapter.isLive) {
                                if (isFinite(this.targetCurrentTime) &&
                                    isFinite(this._startTime)) {
                                    updater.videoProperties.maxSeek = (this.targetCurrentTime - this._startTime) * numberOfMilisecondsInASecond;
                                } else {
                                    updater.videoProperties.maxSeek = 0;
                                }
                            } else {
                                if (isFinite(this._endTime)) {
                                    updater.videoProperties.maxSeek = this._endTime * numberOfMilisecondsInASecond;
                                }
                            }
                        } else {
                            updater.videoProperties.minSeek = 0;
                            updater.videoProperties.maxSeek = 0;
                        }
                        if (isFinite(this.targetCurrentTime)) {
                            updater.videoProperties.playbackPosition = this.targetCurrentTime * numberOfMilisecondsInASecond;
                        } else {
                            updater.videoProperties.playbackPosition = 0;
                        }
                        updater.videoProperties.playbackRate = this.targetPlaybackRate;

                        if (this._mediaElementAdapter &&
                            this._mediaElementAdapter.mediaElement &&
                            updater.type) {
                            // We use -1 to indicate to the SystemMediaTransportControl that the
                            // media represents a live event
                            if (this._mediaElementAdapter.isLive) {
                                updater.videoProperties.mediaStart = 0;
                                updater.videoProperties.mediaEnd = -1;
                            } else {
                                if (this._mediaElementAdapter.mediaElement.duration &&
                                    isFinite(this._mediaElementAdapter.mediaElement.duration)) {
                                    updater.videoProperties.mediaStart = 0;
                                    updater.videoProperties.mediaEnd = this._mediaElementAdapter.mediaElement.duration * numberOfMilisecondsInASecond;
                                }
                            }
                        }
                    }

                    updater.update();
                },

                _updateTimeDisplay: function () {

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement &&
                        (!wuiv.ApplicationView || (wuiv.ApplicationView.value !== wuiv.ApplicationViewState.snapped))) {
                        if (this._mediaElementAdapter.mediaElement.readyState < this._MediaReadyState.MediaReadyState_Have_FutureData) {
                            this._clearTimeDisplay();
                        } else {
                            var elapsedTime = this._getElapsedTimeText();
                            this._currentTimeIndicator.textContent = elapsedTime;
                            this._totalTimeIndicator.textContent = "-" + this._getTotalTimeText();

                            if (this._isInFastForwardOrRewindMode) {
                                this._seekTimeIndicator.textContent = elapsedTime;
                            }
                        }
                    }
                },

                // Helper function to update all the UI on the timeline
                _updateTimelineVisuals: function () {

                    this._syncTimeAndProgress(true);
                    this._updateTimeDisplay();
                },

                _initializeTransportBarButtons: function () {

                    var newCommandsBindingList = new BindingList.List();
                    for (var i = 0, len = this._builtInButtonsList.length; i < len; i++) {
                        var currentBuiltInButton = this._builtInButtonsList[i];
                        var newCommand = null;
                        var commandEl = null;

                        commandEl = _Global.document.createElement("button");
                        utilities.addClass(commandEl, currentBuiltInButton.classList);
                        newCommand = new _Command.AppBarCommand(commandEl, currentBuiltInButton.options);
                        newCommandsBindingList.push(newCommand);
                    }

                    // If there are any custom buttons, put them in the transport controls. Custom buttons go at the end.
                    for (var i = 0, len = this._customButtons.length; i < len; i++) {
                        // Insert any custom buttons by default after the zoom button
                        _ControlProcessor.process(this._customButtons[i]);
                        newCommandsBindingList.push(this._customButtons[i].winControl);
                    }

                    this._toolbar.data = newCommandsBindingList;
                    this._totalSeekBarWidth = this._seekBar.clientWidth;
                    this._thumbElementWidthDividedByTwo = this._thumbElement.clientWidth / 2;
                    this._thumbImageElementWidthDividedByTwo = this._thumbnailImage.clientWidth / 2;
                },

                _updateUIAndRaiseEvents: function (mediaCommand, mediaCommandDisplayString) {
                    this.dispatchEvent("mediacommandexecuted", { mediaCommand: mediaCommand });
                    this._updateMediaState(false);
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.isControlsVisible" helpKeyword="WinJS.UI.MediaPlayer.isControlsVisible">
                /// Gets a property that specifies whether the transport controls are visible.
                /// </field>
                isControlsVisible: {

                    get: function () {
                        return this._controlsVisible;
                    }
                },


                /// <field type="Object" locid="WinJS.UI.MediaPlayer.endTime" helpKeyword="WinJS.UI.MediaPlayer.endTime">
                /// Gets or sets maximum playback position of the media. By default, the value is the duration of the media.
                /// </field>
                endTime: {

                    get: function () {
                        if (this._endTime) {
                            return this._endTime;
                        } else if (this._mediaElementAdapter &&
                            this._mediaElementAdapter.mediaElement) {
                            return this._mediaElementAdapter.mediaElement.duration;
                        } else {
                            return undefined;
                        }
                    },

                    set: function (value) {
                        if (value < 0 ||
                            isNaN(value) ||
                            !isFinite(value)) {
                            throw new _ErrorFromName("WinJS.UI.MediaPlayer.invalidTimeValue", strings.mediaPlayerInvalidTimeValue);
                        }

                        this._endTime = value;
                        this._wasEndTimeSetProgrammatically = true;

                        this._totalTime = this._endTime - this._startTime;

                        // Setting this value ensures that if the developer has added custom markers before the media's 'loadstart' event, the 'loadstart'
                        // will not erase the old value of startTime.
                        if (!this._mediaElementAdapter ||
                            !this._mediaElementAdapter.mediaElement ||
                            this._mediaElementAdapter.mediaElement.readyState < this._MediaReadyState.MediaReadyState_Have_Metadata) {
                            this._doesEndTimeNeedResetting = false;
                        }

                        this._subscribeToTimeUpdates();

                        // Update the time display
                        this._updateTimelineVisuals();

                        this._updateMediaState(false);
                    },
                },

                /// <field type="HTMLElement" domElement="true" hidden="true" locid="WinJS.UI.MediaPlayer.element" helpKeyword="WinJS.UI.MediaPlayer.element">
                /// The DOM element that hosts the MediaPlayer control.
                /// </field>
                element: {
                    get: function () {
                        return this._element;
                    }
                },

                /// <field type="Object" hidden="true" locid="WinJS.UI.MediaPlayer.commands" helpKeyword="WinJS.UI.MediaPlayer.commands">
                /// Gets or sets the commands that appear in the transport controls. The collection is a binding list of WinJS.UI.Command objects.
                /// </field>
                commands: {
                    get: function () {
                        return this._toolbar.data;
                    },

                    set: function (value) {
                        this._toolbar.data = value;
                        this._isCommandsSetByUser = true;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.compact" helpKeyword="WinJS.UI.MediaPlayer.compact">
                /// Gets or sets a value indicating whether the MediaPlayer is using a layout that minimized space used, but only has room for a limited number of
                /// commands or a layout that has room for a lot of commands, but takes up more space.
                /// </field>
                compact: {
                    get: function () {
                        return this._compact;
                    },

                    set: function (value) {
                        // Fast return if the value is unchanged.
                        if (this._compact === value) {
                            return;
                        }
                        if (this._isCommandsSetByUser) {
                            throw new _ErrorFromName("WinJS.UI.MediaPlayer.unSupportedOperation", strings.unSupportedOperation);
                        }
                        this._compact = value;
                        if (this._compact) {
                            // Put the timeline in the toolbar. The timeline must be a valid winControl to be put in the toolbar so we
                            // turn it into one if it is not already.
                            var timelineCommand = null;
                            if (!this._timeline.winControl) {
                                var timelineCommand = new _Command.Command(this._timeline, { type: 'content', priority: 2, extraClass: 'win-mediaplayer-neveroverflow' });
                            } else {
                                timelineCommand = this._timeline.winControl;
                            }

                            // Remove the TimeLine from top of the toolbar.
                            this._timeline.parentNode.removeChild(this._timeline);
                            var toolbarCommands = this._toolbar.data;
                            toolbarCommands.splice(0, 0, timelineCommand);
                            if (this._playPauseFullIndex >= 0) {
                                toolbarCommands.move(this._playPauseFullIndex+1, this._playPauseCompactIndex);
                            }

                            utilities.removeClass(this._element, "win-mediaplayer-doublerow");
                            utilities.addClass(this._element, "win-mediaplayer-singlerow");
                        } else {

                            var toolbarCommands = this._toolbar.data;
                            // Shift PlayPause Button if exist and Remove Timeline.
                            if (this._playPauseFullIndex >= 0) {
                                toolbarCommands.move(this._playPauseCompactIndex, this._playPauseFullIndex);
                            }
                            toolbarCommands.splice(0, 1);

                            // Put the timeline on top of the toolbar
                            this._toolbarElement.parentNode.insertBefore(this._timeline, this._toolbarElement);

                            utilities.removeClass(this._element, "win-mediaplayer-singlerow");
                            utilities.addClass(this._element, "win-mediaplayer-doublerow");
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.isFullScreen" helpKeyword="WinJS.UI.MediaPlayer.isFullScreen">
                /// Gets or sets a value indicating whether the MediaPlayer is full screen.
                /// </field>
                isFullScreen: {
                    get: function () {
                        return this._fullScreen;
                    },

                    set: function (fullScreen) {

                        // Fast return if the value is unchanged. 
                        if (this._fullScreen === fullScreen) {
                            return;
                        }

                        var elementToMakeFullscreen = _Global.document.body;
                        if (fullScreen) {
                            utilities.addClass(this._element, "win-mediaplayer-fullscreen");
                            utilities.removeClass(this.element, "win-focusable");

                            this._element.removeEventListener("keydown", this._keydownInputHandler);
                            this._element.removeEventListener("keyup", this._keyupInputHandler);
                            utilities._documentListener.addEventListener(this._element, "keydown", this._keydownInputHandler);
                            utilities._documentListener.addEventListener(this._element, "keyup", this._keyupInputHandler);

                            if (this._toggleFullScreenButton) {
                                this._toggleFullScreenButton.icon = "backtowindow";
                            }

                            // Go into full screen
                            if (_WinRT.Windows.UI.ViewManagement.ApplicationView) {
                                var applicationView = _WinRT.Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
                                applicationView.tryEnterFullScreenMode();
                            } else {
                                if (elementToMakeFullscreen.requestFullscreen) {
                                    elementToMakeFullscreen.requestFullscreen();
                                    utilities._documentListener.addEventListener(this._element, "fullscreenchange", this._fullScreenChangeHandler);
                                    utilities._documentListener.addEventListener(this._element, "fullscreenerror", this._fullScreenErrorHandler);
                                } else if (elementToMakeFullscreen.msRequestFullscreen) {
                                    elementToMakeFullscreen.msRequestFullscreen();
                                    utilities._documentListener.addEventListener(this._element, "MSFullscreenChange", this._fullScreenChangeHandler);
                                    utilities._documentListener.addEventListener(this._element, "MSFullscreenError", this._fullScreenErrorHandler);
                                } else if (elementToMakeFullscreen.mozRequestFullScreen) {
                                    elementToMakeFullscreen.mozRequestFullScreen();
                                    utilities._documentListener.addEventListener(this._element, "mozfullscreenchange", this._fullScreenChangeHandler);
                                    utilities._documentListener.addEventListener(this._element, "mozfullscreenerror", this._fullScreenErrorHandler);
                                } else if (elementToMakeFullscreen.webkitRequestFullscreen) {
                                    elementToMakeFullscreen.webkitRequestFullscreen();
                                    utilities._documentListener.addEventListener(this._element, "webkitfullscreenchange", this._fullScreenChangeHandler);
                                    utilities._documentListener.addEventListener(this._element, "webkitfullscreenerror", this._fullScreenErrorHandler);
                                }
                            }

                            // set the MediaPlayer to the child of the body object, we might lose parent styling in fullscreen.
                            if (_Global.document.body !== this._element.parentNode) {
                                this._originalParent = this._element.parentNode;
                                this._nextSibiling = this._element.nextSibling;
                                _Global.document.body.appendChild(this._element);
                            }

                            this._recalculateCachedUIElementSizes();
                        } else {
                            utilities.removeClass(this._element, "win-mediaplayer-fullscreen");
                            utilities.addClass(this.element, "win-focusable");

                            utilities._documentListener.removeEventListener(this._element, "keydown", this._keydownInputHandler);
                            utilities._documentListener.removeEventListener(this._element, "keyup", this._keyupInputHandler);

                            this._element.addEventListener("keydown", this._keydownInputHandler, false);
                            this._element.addEventListener("keyup", this._keyupInputHandler, false);

                            if (this._toggleFullScreenButton) {
                                this._toggleFullScreenButton.icon = "fullscreen";
                            }

                            // Exit full screen
                            if (_WinRT.Windows.UI.ViewManagement.ApplicationView) {
                                var applicationView = _WinRT.Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
                                applicationView.exitFullScreenMode();
                            } else {
                                if (_Global.document.exitFullscreen) {
                                    utilities._documentListener.removeEventListener(this._element, "fullscreenchange", this._fullScreenChangeHandler);
                                    utilities._documentListener.removeEventListener(this._element, "fullscreenerror", this._fullScreenErrorHandler);
                                    _Global.document.exitFullscreen();
                                } else if (_Global.document.msExitFullscreen) {
                                    utilities._documentListener.removeEventListener(this._element, "MSFullscreenChange", this._fullScreenChangeHandler);
                                    utilities._documentListener.removeEventListener(this._element, "MSFullscreenError", this._fullScreenErrorHandler);
                                    _Global.document.msExitFullscreen();
                                } else if (_Global.document.mozCancelFullScreen) {
                                    utilities._documentListener.removeEventListener(this._element, "mozfullscreenchange", this._fullScreenChangeHandler);
                                    utilities._documentListener.removeEventListener(this._element, "mozfullscreenerror", this._fullScreenErrorHandler);
                                    _Global.document.mozCancelFullScreen();
                                } else if (_Global.document.webkitCancelFullScreen) {
                                    utilities._documentListener.removeEventListener(this._element, "webkitfullscreenchange", this._fullScreenChangeHandler);
                                    utilities._documentListener.removeEventListener(this._element, "webkitfullscreenerror", this._fullScreenErrorHandler);
                                    _Global.document.webkitCancelFullScreen();
                                }
                            }

                            if (this._originalParent) {
                                // Reset back to the original parent
                                if (this._nextSibiling) {
                                    this._originalParent.insertBefore(this._element, this._nextSibiling);
                                    this._nextSibiling = null;
                                } else {
                                    this._originalParent.appendChild(this._element);
                                }
                                this._originalParent = null;
                            }
                            this._recalculateCachedUIElementSizes();
                        }

                        this._fullScreen = fullScreen;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.isThumbnailEnabled" helpKeyword="WinJS.UI.MediaPlayer.isThumbnailEnabled">
                /// Gets or sets a value indicating whether to use thumbnails for fast forward, rewind and scrubbing. If true, the fast forward, rewind and scrub operations
                /// will pause the mediaElement and cycle thumbnails as the user changes position. If false, the fast forward, rewind operations will increase or decrease
                /// the mediaElement's playbackRate and the scrub operation will move the position.
                /// </field>
                isThumbnailEnabled: {

                    get: function () {
                        return this._thumbnailEnabled;
                    },

                    set: function (value) {
                        if (value) {
                            utilities.addClass(this._timeline, "win-mediaplayer-thumbnailmode");
                        } else {
                            utilities.removeClass(this._timeline, "win-mediaplayer-thumbnailmode");
                        }
                        this._thumbnailEnabled = value;
                    },
                },

                /// <field type="Object" locid="WinJS.UI.MediaPlayer.markers" helpKeyword="WinJS.UI.MediaPlayer.markers">
                /// Gets or sets the MediaPlayer's marker collection.
                /// </field>
                markers: {

                    get: function () {
                        return this._markers;
                    },

                    set: function (value) {

                        // Clear any existing markers
                        this._markers.length = 0;
                        this._markers = value;

                        // Setting this value ensures that if the developer has added custom markers before the media's 'loadstart' event, the 'loadstart'
                        // will not delete those markers.
                        if (!this._mediaElementAdapter ||
                            !this._mediaElementAdapter.mediaElement ||
                            this._mediaElementAdapter.mediaElement.readyState < this._MediaReadyState.MediaReadyState_Have_Metadata) {
                            this._doMarkersNeedResetting = false;
                        }

                        // Unsubscribe from time update if there are no markers in the array
                        if (!this._markers.length) {
                            this._hasCustomMarkers = false;
                            this._unsubscribeFromTimeUpdates();
                        }  else {
                            this._hasCustomMarkers = true;
                        }

                        this._onMarkerCollectionChanged();
                    }
                },

                /// <field type="Object" locid="WinJS.UI.MediaPlayer.mediaElementAdapter" helpKeyword="WinJS.UI.MediaPlayer.mediaElementAdapter">
                /// Gets or sets an interface that your application can implement to have more control over synchronization between
                /// the MediaPlayer and your media.
                /// </field>
                mediaElementAdapter: {

                    get: function () {
                        return this._mediaElementAdapter;
                    },

                    set: function (value) {

                        var oldMediaElement = null;
                        var newMediaElement = null;

                        if (this._mediaElementAdapter &&
                            this._mediaElementAdapter.mediaElement) {
                            oldMediaElement = this._mediaElementAdapter.mediaElement;
                        }

                        if (value &&
                            value.mediaElement) {
                            newMediaElement = value.mediaElement;
                        }

                        this._setupNewMediaElement(newMediaElement, oldMediaElement);

                        this._mediaElementAdapter = value;
                    }
                },

                /// <field type="Object" locid="WinJS.UI.MediaPlayer.startTime" helpKeyword="WinJS.UI.MediaPlayer.startTime">
                /// Gets or sets minimum playback position of the media. By default the value is zero.
                /// </field>
                startTime: {

                    get: function () {
                        return this._startTime || 0;
                    },

                    set: function (value) {
                        if (value < 0 ||
                            isNaN(value) ||
                            !isFinite(value)) {
                            throw new _ErrorFromName("WinJS.UI.MediaPlayer.invalidTimeValue", strings.mediaPlayerInvalidTimeValue);
                        }

                        this._startTime = value;
                        this._wasStartTimeSetProgrammatically = true;

                        this._totalTime = this._endTime - this._startTime;

                        // Setting this value ensures that if the developer has added custom markers before the media's 'loadstart' event, the 'loadstart'
                        // will not erase the old value of startTime.
                        if (!this._mediaElementAdapter ||
                            !this._mediaElementAdapter.mediaElement ||
                            this._mediaElementAdapter.mediaElement.readyState < this._MediaReadyState.MediaReadyState_Have_Metadata) {
                            this._doesStartTimeNeedResetting = false;
                        }

                        this._subscribeToTimeUpdates();
                        // Update the time display
                        this._updateTimelineVisuals();

                        this._updateMediaState(false);
                    },
                },

                /// <field type="Object" locid="WinJS.UI.MediaPlayer.targetCurrentTime" helpKeyword="WinJS.UI.MediaPlayer.targetCurrentTime">
                /// Gets the current time as it is represented in the UI. While fast forwarding or rewinding, this property may be different than the video or audio
                /// tag's 'currentTime' property. This is because during a fast forward or rewind operation, the media is paused while the timeline animates to
                /// simulate a fast forward or rewind operation.
                /// </field>
                targetCurrentTime: {

                    get: function () {

                        var targetCurrentTime = 0;

                        if (this._simulatedFastForwardMode &&
                            this._isInFastForwardOrRewindMode) {
                            targetCurrentTime = this._targetCurrentTime;
                        } else {
                            if (this._mediaElementAdapter &&
                                this._mediaElementAdapter.mediaElement) {
                                targetCurrentTime = this._mediaElementAdapter.mediaElement.currentTime;
                            }
                        }

                        return targetCurrentTime;
                    }
                },

                /// <field type="Object" locid="WinJS.UI.MediaPlayer.targetPlaybackRate" helpKeyword="WinJS.UI.MediaPlayer.targetPlaybackRate">
                /// Gets the playbackRate as it is represented in the UI. While fast forwarding or rewinding, this property may be different than the video or audio
                /// tag's 'playbackRate' property. This is because during a fast forward or rewind operation, the media is paused while the timeline animates to
                /// simulate a fast forward or rewind operation.
                /// </field>
                targetPlaybackRate: {

                    get: function () {

                        var targetPlaybackRate = 0;

                        if (this._simulatedFastForwardMode &&
                            this._isInFastForwardOrRewindMode) {
                            targetPlaybackRate = this._targetPlaybackRate;
                        } else {
                            if (this._mediaElementAdapter &&
                                this._mediaElementAdapter.mediaElement) {
                                targetPlaybackRate = this._mediaElementAdapter.mediaElement.playbackRate;
                            }
                        }

                        return targetPlaybackRate;
                    }
                },

                /// <field type="Object" locid="WinJS.UI.MediaPlayer.timeFormatter" helpKeyword="WinJS.UI.MediaPlayer.timeFormatter">
                /// Gets or sets a function that converts raw time data from the video or audio tag into text to display in the UI of the MediaPlayer.
                /// </field>
                timeFormatter: {

                    get: function () {
                        return this._timeFormatter;
                    },

                    set: function (value) {

                        if (value) {
                            this._timeFormatter = value;
                        } else {
                            // If timeFormatter is 'null', then use the default timeFormatter
                            this._timeFormatter = this._defaultTimeFormatter;
                        }
                    }
                },

                /// <field type="Object" locid="WinJS.UI.MediaPlayer.thumbnailImage" helpKeyword="WinJS.UI.MediaPlayer.thumbnailImage">
                /// Sets the path to the current thumbnail image to display.
                /// </field>
                thumbnailImage: {
                    set: function (value) {
                        this._thumbnailImageVisual.style.backgroundImage = "url(" + value + ")";
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.castButtonVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.castButtonVisible">
                /// Gets or sets whether the CAST button is visible.
                /// </field>
                castButtonVisible: {
                    get: function () {
                        return this._castButtonVisible;
                    },

                    set: function (value) {
                        this._castButtonVisible = value ? true : false;
                        this._castButton.hidden = !this._castButtonVisible;

                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.castButtonEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.castButtonEnabled">
                /// Gets or sets whether the cast button is enabled.
                /// </field>
                castButtonEnabled: {
                    get: function () {
                        return this._castButtonEnabled;
                    },

                    set: function (value) {
                        this._castButtonEnabled = value ? true : false;
                        if (this._castButtonEnabled) {
                            this._castButton.disabled = false;
                        } else {
                            this._castButton.disabled = true;
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.chapterSkipBackButtonVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.chapterSkipBackButtonVisible">
                /// Gets or sets whether the chapter skip back button is visible.
                /// </field>
                chapterSkipBackButtonVisible: {
                    get: function () {
                        return this._chapterSkipBackButtonVisible;
                    },

                    set: function (value) {
                        this._chapterSkipBackButtonVisible = value ? true : false;
                        this._chapterSkipBackButton.hidden = !this._chapterSkipBackButtonVisible;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.chapterSkipBackButtonEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.chapterSkipBackButtonEnabled">
                /// Gets or sets whether the chapter skip back button is enabled.
                /// </field>
                chapterSkipBackButtonEnabled: {
                    get: function () {
                        return this._chapterSkipBackButtonEnabled;
                    },

                    set: function (value) {
                        this._chapterSkipBackButtonEnabled = value ? true : false;
                        if (this._chapterSkipBackButtonEnabled) {
                            this._chapterSkipBackButton.disabled = false;
                        } else {
                            this._chapterSkipBackButton.disabled = true;
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.chapterSkipForwardButtonVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.chapterSkipForwardButtonVisible">
                /// Gets or sets whether the chapter skip forward button is visible.
                /// </field>
                chapterSkipForwardButtonVisible: {
                    get: function () {
                        return this._chapterSkipForwardButtonVisible;
                    },

                    set: function (value) {
                        this._chapterSkipForwardButtonVisible = value ? true : false;
                        this._chapterSkipForwardButton.hidden = !this._chapterSkipForwardButtonVisible;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.chapterSkipForwardButtonEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.chapterSkipForwardButtonEnabled">
                /// Gets or sets whether the chapter skip forward button is enabled.
                /// </field>
                chapterSkipForwardButtonEnabled: {
                    get: function () {
                        return this._chapterSkipForwardButtonEnabled;
                    },

                    set: function (value) {
                        this._chapterSkipForwardButtonEnabled = value ? true : false;
                        if (this._chapterSkipForwardButtonEnabled) {
                            this._chapterSkipForwardButton.disabled = false;
                        } else {
                            this._chapterSkipForwardButton.disabled = true;
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.fastForwardButtonVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.fastForwardButtonVisible">
                /// Gets or sets whether the fast forward button is visible.
                /// </field>
                fastForwardButtonVisible: {
                    get: function () {
                        return this._fastForwardButtonVisible;
                    },

                    set: function (value) {
                        this._fastForwardButtonVisible = value ? true : false;
                        this._fastForwardButton.hidden = !this._fastForwardButtonVisible;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.fastForwardButtonEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.fastForwardButtonEnabled">
                /// Gets or sets whether the fast forward button is enabled.
                /// </field>
                fastForwardButtonEnabled: {
                    get: function () {
                        return this._fastForwardButtonEnabled;
                    },

                    set: function (value) {
                        this._fastForwardButtonEnabled = value ? true : false;
                        if (this._fastForwardButtonEnabled) {
                            this._fastForwardButton.disabled = false;
                        } else {
                            this._fastForwardButton.disabled = true;
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.fullscreenButtonVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.fullscreenButtonVisible">
                /// Gets or sets whether the full screen button is visible.
                /// </field>
                fullscreenButtonVisible: {
                    get: function () {
                        return this._fullscreenButtonVisible;
                    },

                    set: function (value) {
                        this._fullscreenButtonVisible = value ? true : false;
                        this._toggleFullScreenButton.hidden = !this._fullscreenButtonVisible;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.fullscreenButtonEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.fullscreenButtonEnabled">
                /// Gets or sets whether the more button is enabled.
                /// </field>
                fullscreenButtonEnabled: {
                    get: function () {
                        return this._fullscreenButtonEnabled;
                    },

                    set: function (value) {
                        this._fullscreenButtonEnabled = value ? true : false;
                        if (this._fullscreenButtonEnabled) {
                            this._toggleFullScreenButton.disabled = false;
                        } else {
                            this._toggleFullScreenButton.disabled = true;
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.goToLiveButtonVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.goToLiveButtonVisible">
                /// Gets or sets whether the LIVE button is visible.
                /// </field>
                goToLiveButtonVisible: {
                    get: function () {
                        return this._goToLiveButtonVisible;
                    },

                    set: function (value) {
                        this._goToLiveButtonVisible = value ? true : false;
                        this._goToLiveButton.hidden = !this._goToLiveButtonVisible;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.goToLiveButtonEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.goToLiveButtonEnabled">
                /// Gets or sets whether the LIVE button is enabled.
                /// </field>
                goToLiveButtonEnabled: {
                    get: function () {
                        return this._goToLiveButtonEnabled;
                    },

                    set: function (value) {
                        this._goToLiveButtonEnabled = value ? true : false;
                        if (this._goToLiveButtonEnabled) {
                            this._goToLiveButton.disabled = false;
                        } else {
                            this._goToLiveButton.disabled = true;
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.nextTrackButtonVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.nextTrackButtonVisible">
                /// Gets or sets whether the next track button is visible.
                /// </field>
                nextTrackButtonVisible: {
                    get: function () {
                        return this._nextTrackButtonVisible;
                    },

                    set: function (value) {
                        this._nextTrackButtonVisible = value ? true : false;
                        this._nextTrackButton.hidden = !this._nextTrackButtonVisible;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.nextTrackButtonEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.nextTrackButtonEnabled">
                /// Gets or sets whether the next track button is enabled.
                /// </field>
                nextTrackButtonEnabled: {
                    get: function () {
                        return this._nextTrackButtonEnabled;
                    },

                    set: function (value) {
                        this._nextTrackButtonEnabled = value ? true : false;
                        if (this._nextTrackButtonEnabled) {
                            this._nextTrackButton.disabled = false;
                        } else {
                            this._nextTrackButton.disabled = true;
                        }

                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.playFromBeginningButtonVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.playFromBeginningButtonVisible">
                /// Gets or sets whether the play from beginning button is visible.
                /// </field>
                playFromBeginningButtonVisible: {
                    get: function () {
                        return this._playFromBeginningButtonVisible;
                    },

                    set: function (value) {
                        this._playFromBeginningButtonVisible = value ? true : false;
                        this._playFromBeginningButton.hidden = !this._playFromBeginningButtonVisible;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.playFromBeginningButtonEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.playFromBeginningButtonEnabled">
                /// Gets or sets whether the play from beginning button is enabled.
                /// </field>
                playFromBeginningButtonEnabled: {
                    get: function () {
                        return this._playFromBeginningButtonEnabled;
                    },

                    set: function (value) {
                        this._playFromBeginningButtonEnabled = value ? true : false;
                        if (this._playFromBeginningButtonEnabled) {
                            this._playFromBeginningButton.disabled = false;
                        } else {
                            this._playFromBeginningButton.disabled = true;
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.playPauseButtonVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.playPauseButtonVisible">
                /// Gets or sets whether the play / pause button is visible.
                /// </field>
                playPauseButtonVisible: {
                    get: function () {
                        return this._playPauseButtonVisible;
                    },

                    set: function (value) {
                        this._playPauseButtonVisible = value ? true : false;
                        this._playPauseButton.hidden = !this._playPauseButtonVisible;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.playPauseButtonEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.playPauseButtonEnabled">
                /// Gets or sets whether the play / pause button is enabled.
                /// </field>
                playPauseButtonEnabled: {
                    get: function () {
                        return this._playPauseButtonEnabled;
                    },

                    set: function (value) {
                        this._playPauseButtonEnabled = value ? true : false;
                        if (this._playPauseButtonEnabled) {
                            this._playPauseButton.disabled = false;
                        } else {
                            this._playPauseButton.disabled = true;
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.playbackRateButtonVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.playbackRateButtonVisible">
                /// Gets or sets whether the playback rate button is visible.
                /// </field>
                playbackRateButtonVisible: {
                    get: function () {
                        return this._playbackRateButtonVisible;
                    },

                    set: function (value) {
                        this._playbackRateButtonVisible = value ? true : false;
                        this._playbackRateButton.hidden = !this._playbackRateButtonVisible;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.playbackRateButtonEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.playbackRateButtonEnabled">
                /// Gets or sets whether the playback rate button is enabled.
                /// </field>
                playbackRateButtonEnabled: {
                    get: function () {
                        return this._playbackRateButtonEnabled;
                    },

                    set: function (value) {
                        this._playPauseButtonEnabled = value ? true : false;
                        if (this._playbackRateButtonEnabled) {
                            this._playbackRateButton.disabled = false;
                        } else {
                            this._playbackRateButton.disabled = true;
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.previousTrackButtonVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.previousTrackButtonVisible">
                /// Gets or sets whether the previous track button is visible.
                /// </field>
                previousTrackButtonVisible: {
                    get: function () {
                        return this._previousTrackButtonVisible;
                    },

                    set: function (value) {
                        this._previousTrackButtonVisible = value ? true : false;
                        this._previousTrackButton.hidden = !this._previousTrackButtonVisible;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.previousTrackButtonEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.previousTrackButtonEnabled">
                /// Gets or sets whether the previous track button is enabled.
                /// </field>
                previousTrackButtonEnabled: {
                    get: function () {
                        return this._previousTrackButtonEnabled;
                    },

                    set: function (value) {
                        this._previousTrackButtonEnabled = value ? true : false;
                        if (this._previousTrackButtonEnabled) {
                            this._previousTrackButton.disabled = false;
                        } else {
                            this._previousTrackButton.disabled = true;
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.rewindButtonVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.rewindButtonVisible">
                /// Gets or sets whether the rewind button is visible.
                /// </field>
                rewindButtonVisible: {
                    get: function () {
                        return this._rewindButtonVisible;
                    },

                    set: function (value) {
                        this._rewindButtonVisible = value ? true : false;
                        this._rewindButton.hidden = !this._rewindButtonVisible;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.rewindButtonEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.rewindButtonEnabled">
                /// Gets or sets whether the rewind button is enabled.
                /// </field>
                rewindButtonEnabled: {
                    get: function () {
                        return this._rewindButtonEnabled;
                    },

                    set: function (value) {
                        this._rewindButtonEnabled = value ? true : false;
                        if (this._rewindButtonEnabled) {
                            this._rewindButton.disabled = false;
                        } else {
                            this._rewindButton.disabled = true;
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.seekBarVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.seekBarVisible">
                /// Gets or sets whether the seek bar is visible.
                /// </field>
                seekBarVisible: {
                    get: function () {
                        return this._seekBarVisible;
                    },

                    set: function (value) {
                        this._seekBarVisible = value ? true : false;
                        if (this._seekBarVisible) {
                            utilities.removeClass(this._progressContainer, "win-mediaplayer-hidden");
                        } else {
                            utilities.addClass(this._progressContainer, "win-mediaplayer-hidden");
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.seekingEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.seekingEnabled">
                /// Gets or sets whether the seeking is enabled.
                /// </field>
                seekingEnabled: {
                    get: function () {
                        if (this._mediaElementAdapter) {
                            return this._mediaElementAdapter.isSeekAllowed;
                        }
                        return false;
                    },

                    set: function (value) {
                        if (this._mediaElementAdapter) {
                            if (value) {
                                this._mediaElementAdapter.isSeekAllowed = true;
                            } else {
                                this._mediaElementAdapter.isSeekAllowed = false;
                            }
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.stopButtonVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.stopButtonVisible">
                /// Gets or sets whether the stop button is visible.
                /// </field>
                stopButtonVisible: {
                    get: function () {
                        return this._stopButtonVisible;
                    },

                    set: function (value) {
                        this._stopButtonVisible = value ? true : false;
                        this._stopButton.hidden = !this._stopButtonVisible;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.stopButtonEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.stopButtonEnabled">
                /// Gets or sets whether the stop button is enabled.
                /// </field>
                stopButtonEnabled: {
                    get: function () {
                        return this._stopButtonEnabled;
                    },

                    set: function (value) {
                        this._stopButtonEnabled = value ? true : false;
                        if (this._stopButtonEnabled) {
                            this._stopButton.disabled = false;
                        } else {
                            this._stopButton.disabled = true;
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.timeSkipBackButtonVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.timeSkipBackButtonVisible">
                /// Gets or sets whether the time skip back button is visible.
                /// </field>
                timeSkipBackButtonVisible: {
                    get: function () {
                        return this._timeSkipBackButtonVisible;
                    },

                    set: function (value) {
                        this._timeSkipBackButtonVisible = value ? true : false;
                        this._timeSkipBackButton.hidden = !this._timeSkipBackButtonVisible;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.timeSkipBackButtonEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.timeSkipBackButtonEnabled">
                /// Gets or sets whether the time skip back button is enabled.
                /// </field>
                timeSkipBackButtonEnabled: {
                    get: function () {
                        return this._timeSkipBackButtonEnabled;
                    },

                    set: function (value) {
                        this._timeSkipBackButtonEnabled = value ? true : false;
                        if (this._timeSkipBackButtonEnabled) {
                            this._timeSkipBackButton.disabled = false;
                        } else {
                            this._timeSkipBackButton.disabled = true;
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.timeSkipForwardButtonVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.timeSkipForwardButtonVisible">
                /// Gets or sets whether the time skip forward button is visible.
                /// </field>
                timeSkipForwardButtonVisible: {
                    get: function () {
                        return this._timeSkipForwardButtonVisible;
                    },

                    set: function (value) {
                        this._timeSkipForwardButtonVisible = value ? true : false;
                        this._timeSkipForwardButton.hidden = !this._timeSkipForwardButtonVisible;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.timeSkipForwardButtonEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.timeSkipForwardButtonEnabled">
                /// Gets or sets whether the time skip forward button is enabled.
                /// </field>
                timeSkipForwardButtonEnabled: {
                    get: function () {
                        return this._timeSkipForwardButtonEnabled;
                    },

                    set: function (value) {
                        this._timeSkipForwardButtonEnabled = value ? true : false;
                        if (this._timeSkipForwardButtonEnabled) {
                            this._timeSkipForwardButton.disabled = false;
                        } else {
                            this._timeSkipForwardButton.disabled = true;
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.volumeButtonVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.volumeButtonVisible">
                /// Gets or sets whether the volume button is visible.
                /// </field>
                volumeButtonVisible: {
                    get: function () {
                        return this._volumeButtonVisible;
                    },

                    set: function (value) {
                        this._volumeButtonVisible = value ? true : false;
                        this._volumeButton.hidden = !this._volumeButtonVisible;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.volumeButtonEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.volumeButtonEnabled">
                /// Gets or sets whether the volume button is enabled.
                /// </field>
                volumeButtonEnabled: {
                    get: function () {
                        return this._volumeButtonEnabled;
                    },

                    set: function (value) {
                        this._volumeButtonEnabled = value ? true : false;
                        if (this._volumeButtonEnabled) {
                            this._volumeButton.disabled = false;
                        } else {
                            this._volumeButton.disabled = true;
                        }
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.zoomButtonVisible" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.zoomButtonVisible">
                /// Gets or sets whether the zoom button is visible.
                /// </field>
                zoomButtonVisible: {
                    get: function () {
                        return this._zoomButtonVisible;
                    },

                    set: function (value) {
                        this._zoomButtonVisible = value ? true : false;
                        this._zoomButton.hidden = !this._zoomButtonVisible;
                    }
                },

                /// <field type="Boolean" locid="WinJS.UI.MediaPlayer.TransportControls.zoomButtonEnabled" helpKeyword="WinJS.UI.MediaPlayer.TransportControls.zoomButtonEnabled">
                /// Gets or sets whether the zoom button is enabled.
                /// </field>
                zoomButtonEnabled: {
                    get: function () {
                        return this._zoomButtonEnabled;
                    },

                    set: function (value) {
                        this._zoomButtonEnabled = value ? true : false;
                        if (this._zoomButtonEnabled) {
                            this._zoomButton.disabled = false;
                        } else {
                            this._zoomButton.disabled = true;
                        }
                    }
                },

                // Public methods
                addMarker: function (time, type, data, extraClass) {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.addMarker">
                    /// <summary locid="WinJS.UI.MediaPlayer.addMarker">
                    /// Adds a new timeline marker.
                    /// </summary>
                    /// <param name="time" type="Number" locid="WinJS.UI.MediaPlayer.addMarker_p:time">
                    /// The marker time.
                    /// </param>
                    /// <param name="time" type="String" locid="WinJS.UI.MediaPlayer.addMarker_p:type">
                    /// The marker type.
                    /// </param>
                    /// <param name="time" type="Object" locid="WinJS.UI.MediaPlayer.addMarker_p:data">
                    /// The marker data.
                    /// </param>
                    /// <param name="extraClass" type="String" optional="true" locid="WinJS.UI.MediaPlayer.addMarker_p:extraClass">
                    /// An extra class that can be used to style the marker.
                    /// </param>
                    /// </signature>

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:addMarker,StartTM");

                    if (!this._mediaElementAdapter ||
                        !this._mediaElementAdapter.mediaElement) {
                        return;
                    }

                    if ((!time &&
                        time !== 0) ||
                        isNaN(time)) {

                        throw new _ErrorFromName("WinJS.UI.MediaPlayer.timeNotANumber", strings.mediaPlayerInvalidTimeValue);
                    }

                    if (!type) {
                        type = markerType.chapter;
                    }

                    if (type !== markerType.advertisement &&
                        type !== markerType.chapter &&
                        type !== markerType.custom) {
                        throw new _ErrorFromName("WinJS.UI.MediaPlayer.InvalidMarkerType", strings.mediaPlayerAddMarkerErrorInvalidMarkerType);
                    }

                    // If it's a chapter marker, clear out the default chapter markers
                    if (type === markerType.chapter) {
                        if (!extraClass) {
                            extraClass = "win-mediaplayer-chaptermarker";
                        }

                        if (this._defaultChapterMarkers.length) {
                            this._clearDefaultChapterMarkers();
                        }
                    } else if (type === markerType.advertisement) {
                        if (!extraClass) {
                            extraClass = "win-mediaplayer-advertisementmarker";
                        }

                        if (this._defaultChapterMarkers.length) {
                            this._clearDefaultChapterMarkers();
                        }
                    }

                    // Remove the marker if a marker with the same time already exists
                    var markersLength = this._markers.length;
                    for (var i = 0; i < markersLength; i++) {
                        if (this._markers[i].time === time) {
                            this._markers.splice(i, 1);
                            break;
                        }
                    }

                    this._markers.push({ time: time, type: type, data: data, extraClass: extraClass });
                    // Also make a call to add the marker to the browser
                    
                    // Setting this value ensures that if the developer has added custom markers before the media's 'loadstart' event, the 'loadstart'
                    // will not delete those markers.
                    if (!this._mediaElementAdapter ||
                        !this._mediaElementAdapter.mediaElement ||
                        this._mediaElementAdapter.mediaElement.readyState < this._MediaReadyState.MediaReadyState_Have_Metadata) {
                        this._doMarkersNeedResetting = false;
                    }
                    if (!this._hasCustomMarkers) {
                        this._hasCustomMarkers = true;
                    }

                    this._onMarkerCollectionChanged();

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:addMarker,StopTM");
                },

                chapterSkipBack: function () {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.chapterSkipBack">
                    /// <summary locid="WinJS.UI.MediaPlayer.chapterSkipBack">
                    /// Seeks to the previous chapter marker.
                    /// </summary>
                    /// </signature>

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:chapterSkipBack,StartTM");

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {

                        this._exitFastForwardOrRewind(true);

                        // Note: We're handling the logic for chapterSkipForward at the MediaPlayer level rather than in the
                        // MediaElementAdapater layer, because we want the experience to be consistent.

                        // Figure out where the next marker is
                        var newSeekTime = -1;
                        var currentTime = this._mediaElementAdapter.mediaElement.currentTime;
                        var chapterMarkers = null;

                        if (this._defaultChapterMarkers.length) {
                            chapterMarkers = this._defaultChapterMarkers;
                        } else {
                            chapterMarkers = this._markers;
                        }

                        var chapterMarkersLength = chapterMarkers.length;
                        for (var i = chapterMarkersLength - 1; i >= 0; i--) {
                            if ((chapterMarkers[i].type === markerType.chapter ||
                                chapterMarkers[i].type === markerType.advertisement) &&
                                chapterMarkers[i].time + this._CHAPTER_SKIP_THRESHOLD < currentTime) {
                                newSeekTime = chapterMarkers[i].time;
                                break;
                            }
                        }

                        if (newSeekTime !== -1) {
                            this._seekInternal(newSeekTime, false);
                        } else {
                            this._seekInternal(this._startTime, false);
                        }

                        this._updateUIAndRaiseEvents(mediaCommandEnum.chapterSkipBack, strings.chapterSkipBackMediaCommandDisplayText);
                    }
                },

                chapterSkipForward: function () {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.chapterSkipForward">
                    /// <summary locid="WinJS.UI.MediaPlayer.chapterSkipForward">
                    /// Seeks to the next chapter marker.
                    /// </summary>
                    /// </signature>

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:chapterSkipForward,StartTM");

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {

                        this._exitFastForwardOrRewind(true);

                        // Note: We're handling the logic for chapterSkipForward at the MediaPlayer level rather than in the
                        // MediaElementAdapater layer, because we want the experience to be consistent.

                        // Figure out where the next marker is
                        var newSeekTime = -1;
                        var currentTime = this._mediaElementAdapter.mediaElement.currentTime;
                        var chapterMarkers = null;

                        if (this._defaultChapterMarkers.length) {
                            chapterMarkers = this._defaultChapterMarkers;
                        } else {
                            chapterMarkers = this._markers;
                        }

                        var chapterMarkersLength = chapterMarkers.length;
                        for (var i = 0; i < chapterMarkersLength; i++) {
                            if ((chapterMarkers[i].type === markerType.chapter ||
                                chapterMarkers[i].type === markerType.advertisement) &&
                                chapterMarkers[i].time - this._CHAPTER_SKIP_THRESHOLD > currentTime) {
                                newSeekTime = chapterMarkers[i].time;
                                break;
                            }
                        }

                        if (newSeekTime !== -1) {
                            this._seekInternal(newSeekTime, false);
                        } else {
                            this._seekInternal(this._endTime, false);
                        }

                        this._updateUIAndRaiseEvents(mediaCommandEnum.chapterSkipForward, strings.chapterSkipForwardMediaCommandDisplayText);
                    }
                },

                dispose: function () {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.dispose">
                    /// <summary locid="WinJS.UI.MediaPlayer.dispose">
                    /// Releases MediaPlayer resources.
                    /// </summary>
                    /// </signature>

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:dispose,StartTM");

                    if (this._disposed) {
                        return;
                    }
                    this._disposed = true;

                    // Remove event listeners
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {
                        this._mediaElementAdapter.mediaElement.removeEventListener("seeked", this._handleSeekedAfterExitFastForwardOrRewindBind);
                    }
                    this._handleSeekedAfterExitFastForwardOrRewindBind = null;

                    _ElementUtilities._resizeNotifier.unsubscribe(this._element, this._windowResizeCallback);
                    this._windowResizeCallback = null;

                    _ElementUtilities._resizeNotifier.unsubscribe(this._toolbar, this._toolbarResizeCallback);
                    this._toolbarResizeCallback = null;

                    this._toolbar.removeEventListener("beforeopen", this._handleFlyoutOpenCallbackBind);
                    this._toolbar.removeEventListener("afterclose", this._handleFlyoutCloseCallbackBind);

                    utilities._webUIApplicationListener.removeEventListener(this.element, "resuming", this._checkParentalControlsAvailableBind);

                    if (this._contentRestrictions) {
                        this._contentRestrictions.removeEventListener("restrictionschanged", this._checkParentalControlsBind);
                    }

                    utilities._documentListener.removeEventListener(this._element, "keydown", this._keydownInputHandler);
                    utilities._documentListener.removeEventListener(this._element, "keyup", this._keyupInputHandler);
                    this._controlsKeyupInputHandler = null;
                    utilities._documentListener.removeEventListener(this._element, "fullscreenchange", this._fullScreenChangeHandler);
                    utilities._documentListener.removeEventListener(this._element, "MSFullscreenChange", this._fullScreenChangeHandler);
                    utilities._documentListener.removeEventListener(this._element, "mozfullscreenchange", this._fullScreenChangeHandler);
                    utilities._documentListener.removeEventListener(this._element, "webkitfullscreenchange", this._fullScreenChangeHandler);
                    utilities._documentListener.removeEventListener(this._element, "fullscreenerror", this._fullScreenErrorHandler);
                    utilities._documentListener.removeEventListener(this._element, "MSFullscreenError", this._fullScreenErrorHandler);
                    utilities._documentListener.removeEventListener(this._element, "mozfullscreenerror", this._fullScreenErrorHandler);
                    utilities._documentListener.removeEventListener(this._element, "webkitfullscreenerror", this._fullScreenErrorHandler);
                    this._fullScreenChangeHandler = null;
                    this._fullScreenErrorHandler = null;

                    this._timeline.removeEventListener("keydown", this._handleTimelineArrowKeyDownBind);
                    this._handleTimelineArrowKeyDownBind = null;

                    if (_WinRT.Windows.Media.SystemMediaTransportControls) {
                        utilities._smtcListener.removeEventListener(this.element, "buttonpressed", this._handleSystemTransportControlsButtonPressedBind);
                        utilities._smtcListener.removeEventListener(this.element, "propertychanged", this._handleSystemTransportControlsPropertyChangedBind);
                    }
                    this._handleSystemTransportControlsButtonPressedBind = null;
                    this._handleSystemTransportControlsPropertyChangedBind = null;
                    this._smtControls = null;

                    utilities._documentListener.removeEventListener(this.element, "pointerout", this._inputHandlerMouseOutCallback);
                    _ElementUtilities._globalListener.removeEventListener(this.element, "pointermove", this._inputHandlerPointerMoveCallback);
                    _ElementUtilities._globalListener.removeEventListener(this.element, "pointerup", this._inputHandlerMouseUpCallback);

                    if (this._element) {
                        this._element.removeEventListener("keydown", this._keydownInputHandler);
                        this._element.removeEventListener("keyup", this._keyupInputHandler);
                        this._keydownInputHandler = null;
                        this._keyupInputHandler = null;
                    }

                    nav._navigationListener.removeEventListener(this.element, "beforenavigate", this._handleBeforeNavigatedCallback);

                    if (this._isXbox) {
                        _Global.WinJS.UI.Voice.removeEventListener("listeningstart", this._onShowControlsCommandInvokedBind);
                        _Global.WinJS.UI.Voice.removeEventListener("listeningend", this._onHideControlsCommandInvokedBind);
                        _Global.window.removeEventListener("gestureengaged", this._onShowControlsCommandInvokedBind);
                        _Global.window.removeEventListener("gesturedisengaged", this._onHideControlsCommandInvokedBind);
                        this._onShowControlsCommandInvokedBind = null;
                        this._onHideControlsCommandInvokedBind = null;
                    }

                    if (this._volumeFlyout) {
                        this._volumeFlyout.removeEventListener("aftershow", this._handleVolumeFlyoutShowCallback);
                        this._volumeFlyout.removeEventListener("beforeshow", this._handleFlyoutOpenCallbackBind);
                        this._volumeFlyout.removeEventListener("afterhide", this._handleFlyoutCloseCallbackBind);
                    }
                    if (this._volumeSlider) {
                        this._volumeSlider.removeEventListener("change", this._handleVolumeSliderChangeCallback);
                    }

                    // Remove any dynamically inserted elements from the DOM
                    if (this._audioTracksFlyout) {
                        this._audioTracksFlyout.removeEventListener("beforeshow", this._handleFlyoutOpenCallbackBind);
                        this._audioTracksFlyout.removeEventListener("afterhide", this._handleFlyoutCloseCallbackBind);
                        _Global.document.body.removeChild(this._audioTracksFlyout.element);
                        this._audioTracksFlyout.dispose();
                    }
                    if (this._closedCaptionsFlyout) {
                        this._closedCaptionsFlyout.removeEventListener("beforeshow", this._handleFlyoutOpenCallbackBind);
                        this._closedCaptionsFlyout.removeEventListener("afterhide", this._handleFlyoutCloseCallbackBind);
                        _Global.document.body.removeChild(this._closedCaptionsFlyout.element);
                        this._closedCaptionsFlyout.dispose();
                    }
                    if (this._errorFlyout) {
                        this._errorFlyout.removeEventListener("beforeshow", this._handleFlyoutOpenCallbackBind);
                        this._errorFlyout.removeEventListener("afterhide", this._handleFlyoutCloseCallbackBind);
                        _Global.document.body.removeChild(this._errorFlyout);
                        this._errorFlyout.dispose();
                    }
                    if (this._playbackRateFlyout) {
                        this._playbackRateFlyout.removeEventListener("beforeshow", this._handleFlyoutOpenCallbackBind);
                        this._playbackRateFlyout.removeEventListener("afterhide", this._handleFlyoutCloseCallbackBind);
                        _Global.document.body.removeChild(this._playbackRateFlyout);
                        this._playbackRateFlyout.dispose();
                    }
                    if (this._volumeFlyout) {
                        _Global.document.body.removeChild(this._volumeFlyout.element);
                        this._volumeFlyout.dispose();
                    }

                    // Clear timers
                    this._removeControlsTimer();
                    _Global.clearInterval(this._fastForwardOrRewindTimer);
                    _Global.clearInterval(this._updateMediaStateTimerCookie);
                    this._updateMediaStateTimerCookie = null;
                    this._unsubscribeFromTimeUpdates();

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {
                        this._unsubscribeFromMediaEvents(this._mediaElementAdapter.mediaElement);
                    }
                    this._mediaEventSubscriptions = null;

                    this._removeButtonEventHandlers();
                    this._buttonEventSubscriptions = null;

                    this._removeGestureEventHandlers();
                    this._gestureEventSubscriptions = null;

                    // Remove text track event listeners
                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {
                        var mediaElement = this._mediaElementAdapter.mediaElement;
                        var textTracks = mediaElement.textTracks;
                        if (textTracks) {
                            var tracks = mediaElement.getElementsByTagName("track");
                            var tracksLength = tracks.length;
                            for (var i = 0; i < tracksLength; i++) {
                                if (tracks[i].kind === "chapters") {
                                    tracks[i].removeEventListener("load", this._handleloadTextTrackCallbackBind);
                                }
                            }
                        }
                    }
                    this._handleFlyoutOpenCallbackBind = null;
                    this._handleFlyoutCloseCallbackBind = null;
                    this._handleloadTextTrackCallbackBind = null;
                    this._adjustedContentType = null;
                    this._audioTracksButton = null;
                    this._audioTracksFlyout = null;
                    this._backButton.dispose();
                    this._backButton = null;
                    this._busyIndicator = null;
                    this._castButton = null;
                    this._chapterSkipBackButton = null;
                    this._chapterSkipForwardButton = null;
                    this._checkParentalControlsBind = null;
                    this._checkParentalControlsAvailableBind = null;
                    this._closedCaptionsButton = null;
                    this._closedCaptionsFlyout = null;
                    this._contentRestrictions = null;
                    this._controlHideTimeout = null;
                    this._controls = null;
                    this._currentScrubbingVelocity = null;
                    this._currentTimeIndicator = null;
                    this._currentTimeVisualElements = null;
                    this._defaultChapterMarkers = [];
                    this._defaultChapterMarkers = null;
                    this._endTime = null;
                    this._errorFlyout = null;
                    this._errorText = null;
                    this._fastForwardButton = null;
                    this._fastForwardOrRewindTimer = null;
                    this._fastForwardOrRewindTimerElapsedTime = null;
                    this._gestureRecognizer = null;
                    this._goToLiveButton = null;
                    this._handleBeforeNavigatedCallback = null;
                    this._handleTransportBarButtonClick = null;
                    this._handleTransportBarButtonFocus = null;
                    this._handleTransportBarButtonKeyDown = null;
                    this._handleTransportBarButtonKeyUp = null;
                    this._inputHandlerElement = null;
                    this._inputHandlerClickCallback = null;
                    this._inputHandlerPointerDownCallback = null;
                    this._inputHandlerPointerMoveCallback = null;
                    this._inputHandlerPointerUpCallback = null;
                    this._lastControlsResetTimeStamp = null;
                    this._lastFastForwardOrRewindTimerTime = null;
                    this._lastControlsResetTimeStamp = null;
                    this._lastPointerPosition = null;
                    this._lastPosition = null;
                    this._markers = null;
                    this._mediaCommandFeedbackText = null;

                    if (this._mediaElementAdapter) {
                        this._mediaElementAdapter.dispose();
                    }

                    this._mediaElementAdapter = null;
                    this._mediaMetadata = null;
                    this._mediaPlayerContainer = null;
                    this._mediaPlayerHtml = null;
                    this._mediaState = null;
                    this._metadataTitle = null;
                    this._metadataDescription = null;
                    this._minimumSeekableRangeInPixels = null;
                    this._muteButton = null;
                    this._nextCustomMarkerIndex = null;
                    this._nextCustomMarkerTime = null;
                    this._previousCustomMarkerIndex = null;
                    this._previousCustomMarkerTime = null;
                    this._nextTrackButton = null;
                    this._playbackRateButton = null;
                    this._playbackRateFlyout = null;
                    this._playbackSpeedIndicator = null;
                    this._playPauseButton = null;
                    this._playFromBeginningButton = null;
                    this._previousPlaybackRate = null;
                    this._previousTrackButton = null;
                    this._previousVolumeValue = null;
                    this._progress = null;
                    this._progressContainer = null;
                    this._updateMediaStateBind = null;
                    this._relativeTimelineStartOffset = null;
                    this._rewindButton = null;
                    this._seekBar = null;
                    this._seekMark = null;
                    this._seekTimeIndicator = null;
                    this._seekWindowLeftEdgeElement = null;
                    this._seekWindowRightEdgeElement = null;
                    this._skipAnimations = false;
                    this._startTime = null;
                    this._startOffsetX = null;
                    this._stopButton = null;
                    this._smtControls = null;
                    this._targetCurrentTime = null;
                    this._targetPlaybackRate = null;
                    this._thumbnailImage = null;
                    this._thumbnailImageVisual = null;
                    this._thumbElement = null;
                    this._thumbElementWidthDividedByTwo = null;
                    this._timeFormatter = null;
                    this._thumbImageElementWidthDividedByTwo = null;
                    this._timeBeforeShowingBusyVisual = null;
                    this._timeRemainingIndicator = null;
                    this._timeSeparator = null;
                    this._timeSkipBackButton = null;
                    this._timeSkipForwardButton = null;
                    this._timeline = null;
                    this._toggleFullScreenButton = null;
                    if (this._toolbar) {
                        this._toolbar.dispose();
                    }
                    this._toolbar = null;
                    this._toolbarElement = null;
                    this._totalSeekBarWidth = null;
                    this._totalTimeIndicator = null;
                    this._totalTimeInternal = null;
                    this._transportControls = null;
                    this._updateAudioTracksButtonStateBind = null;
                    this._updateClosedCaptionsButtonStateBind = null;
                    this._volumeButton = null;
                    this._volumeFlyout = null;
                    this._volumeSlider = null;
                    this._volumeValue = null;
                    this._zoomButton = null;
                    this._originalParent = null;
                    this._nextSibiling = null;

                    // Constants
                    this._CHAPTER_SKIP_THRESHOLD = null;

                    this._FAST_FORWARD_OR_REWIND_TIMER_INTERVAL = null;
                    this._MINIMUM_ACCURATE_SEEKABLE_RANGE = null;
                    this._MINIMUM_POINTER_DELTA_TO_ENABLE_SNAPPING_TO_NEAREST_MARKER = null;
                    this._GESTURE_REGION_FOR_MOVING_THE_SEEKABLE_WINDOW = null;
                    this._REPORT_MEDIA_STATE_INTERVAL = null;
                    this._SNAP_TO_NEAREST_MARKER_THRESHOLD = null;

                    this._CONTROLS_AUTO_HIDE_DURATION = null;
                    this._MARKER_PROXIMITY_THRESHOLD = null;
                    // We won't add chapter markers for media under 1 minute
                    this._MINIMUM_MEDIA_LENGTH_FOR_DEFAULT_MARKERS = null;
                    this._MOUSE_LEFT_BUTTON = null;
                    this._MOUSE_POINTER_TYPE = null;
                    this._SEEK_OFFSET = null;
                    this._SKIP_BACK_INTERVAL = null;
                    this._SKIP_FORWARD_INTERVAL = null;

                    this._TAG_NAME_AUDIO = null;
                    this._TAG_NAME_VIDEO = null;

                    _Dispose.disposeSubTree(this._element);

                    this._element.winControl = null;
                    this._element = null;

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:dispose,StopTM");
                },

                fastForward: function () {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.fastForward">
                    /// <summary locid="WinJS.UI.MediaPlayer.fastForward">
                    /// Increases the playback rate of the media.
                    /// </summary>
                    /// </signature>

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:fastForward,StartTM");

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {

                        if (this._mediaElementAdapter.mediaElement.readyState < this._MediaReadyState.MediaReadyState_Have_FutureData) {
                            return;
                        }

                        // We show the controls, because we need to give visual feedback to the user regarding timeline
                        // movement event if the API is called programmatically.
                        if (!this._controlsVisible) {
                            this._showControls();
                        }

                        var newPlaybackRate = null;
                        if (!this._isInFastForwardOrRewindMode) {
                            this._targetPlaybackRate = this._mediaElementAdapter.mediaElement.playbackRate;
                            this._targetCurrentTime = this._mediaElementAdapter.mediaElement.currentTime;
                        }

                        var currentPlaybackRate = null;
                        if (this._simulatedFastForwardMode) {
                            currentPlaybackRate = this._targetPlaybackRate;
                        } else {
                            currentPlaybackRate = this._mediaElementAdapter.mediaElement.playbackRate;
                        }

                        if (!this._isInFastForwardOrRewindMode &&
                            this._mediaElementAdapter.mediaElement.paused &&
                            currentPlaybackRate === this._PLAYBACKRATE_REWIND_2X) {
                            newPlaybackRate = this._PLAYBACKRATE_REWIND_SLOW_MOTION_RATE;
                        } else if (this._mediaElementAdapter.mediaElement.paused &&
                                   currentPlaybackRate === this._PLAYBACKRATE_REWIND_SLOW_MOTION_RATE) {
                            newPlaybackRate = this._PLAYBACKRATE_PLAYING;
                        } else if (!this._isInFastForwardOrRewindMode &&
                                   this._mediaElementAdapter.mediaElement.paused &&
                                   currentPlaybackRate === this._PLAYBACKRATE_PLAYING) {
                            newPlaybackRate = this._PLAYBACKRATE_FAST_FORWARD_SLOW_MOTION_RATE;
                        } else if (this._mediaElementAdapter.mediaElement.paused &&
                                   currentPlaybackRate === this._PLAYBACKRATE_FAST_FORWARD_SLOW_MOTION_RATE) {
                            newPlaybackRate = this._PLAYBACKRATE_FAST_FORWARD_2X;
                        } else if (currentPlaybackRate < this._PLAYBACKRATE_FAST_FORWARD_MAX_RATE &&
                                   currentPlaybackRate >= this._PLAYBACKRATE_FAST_FORWARD_2X) {
                            newPlaybackRate = Math.min(Math.floor(currentPlaybackRate) * 2, this._PLAYBACKRATE_FAST_FORWARD_MAX_RATE);
                        } else if (currentPlaybackRate < this._PLAYBACKRATE_FAST_FORWARD_2X &&
                                   currentPlaybackRate >= this._PLAYBACKRATE_PLAYING) {
                            newPlaybackRate = this._PLAYBACKRATE_FAST_FORWARD_2X;
                        } else if (currentPlaybackRate < this._PLAYBACKRATE_PLAYING &&
                                   currentPlaybackRate >= this._PLAYBACKRATE_REWIND_2X) {
                            newPlaybackRate = this._PLAYBACKRATE_PLAYING;
                        } else if (currentPlaybackRate < this._PLAYBACKRATE_REWIND_2X &&
                                   currentPlaybackRate >= this._PLAYBACKRATE_REWIND_MAX_RATE) {
                            newPlaybackRate = Math.max(Math.floor(currentPlaybackRate) / 2, this._PLAYBACKRATE_REWIND_MAX_RATE);
                        }

                        if (newPlaybackRate) {
                            if (this._simulatedFastForwardMode) {
                                if (this._isFastForwardOrRewind(newPlaybackRate)) {
                                    var oldPlaybackRate = currentPlaybackRate;
                                    this._targetPlaybackRate = newPlaybackRate;
                                    this._updateFastForwardAndRewindState(oldPlaybackRate, newPlaybackRate);
                                } else {
                                    this._exitFastForwardOrRewind(true);
                                }
                            } else {
                                if (this._mediaElementAdapter.mediaElement.paused &&
                                    newPlaybackRate !== this._PLAYBACKRATE_PLAYING) {
                                    this._mediaElementAdapter.play();
                                }

                                this._mediaElementAdapter.mediaElement.playbackRate = newPlaybackRate;
                            }
                        }

                        this._setFastForwardOrRewindText();
                    }
                },

                goToLive: function () {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.goToLive">
                    /// <summary locid="WinJS.UI.MediaPlayer.goToLive">
                    /// Navigates to the real-time position in live streamed media.
                    /// </summary>
                    /// </signature>

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:goToLive,StartTM");

                    if (this._mediaElementAdapter) {

                        this._exitFastForwardOrRewind(true);

                        // We try to handle all time movements as seeks so there are fewer
                        // one code paths to have to worry about for ad skipping.
                        this._seekInternal(this._mediaElementAdapter.liveTime, false);

                        this._updateUIAndRaiseEvents(mediaCommandEnum.goToLive, strings.goToLiveMediaCommandDisplayText);
                    }
                },

                hideControls: function () {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.hideControls">
                    /// <summary locid="WinJS.UI.MediaPlayer.hideControls">
                    /// Hides all the UI associated with the MediaPlayer.
                    /// </summary>
                    /// </signature>

                    this._hideControls();
                },

                nextTrack: function () {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.nextTrack">
                    /// <summary locid="WinJS.UI.MediaPlayer.nextTrack">
                    /// Plays the next track.
                    /// </summary>
                    /// </signature>

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:nextTrack,StartTM");

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.nextTrack) {

                        this._exitFastForwardOrRewind(true);

                        this._mediaElementAdapter.nextTrack();

                        this._updateUIAndRaiseEvents(mediaCommandEnum.nextTrack, strings.nextTrackMediaCommandDisplayText);
                    }
                },

                pause: function () {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.pause">
                    /// <summary locid="WinJS.UI.MediaPlayer.pause">
                    /// Pauses the media.
                    /// </summary>
                    /// </signature>

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:pause,StartTM");

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.pause) {
                        // if currently FF/RR mode then we should exit the mode with pause.
                        if (this._simulatedFastForwardMode &&
                            this._isFastForwardOrRewind(this.targetPlaybackRate)) {
                            this._exitFastForwardOrRewind(false);
                        } else {
                            this._mediaElementAdapter.pause();
                        }

                        this._updateUIAndRaiseEvents(mediaCommandEnum.pause, strings.pauseMediaCommandDisplayText);
                    }
                },

                play: function () {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.play">
                    /// <summary locid="WinJS.UI.MediaPlayer.play">
                    /// Sets the playbackRate to the default playbackRate for the media and plays the media.
                    /// </summary>
                    /// </signature>

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:play,StartTM");

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.play) {

                        if (this._simulatedFastForwardMode &&
                            this._isInFastForwardOrRewindMode) {
                            this._exitFastForwardOrRewind(true);
                        } else if (this._mediaElementAdapter.mediaElement &&
                                   this._mediaElementAdapter.mediaElement.ended ||
                                   this._endTimeReached) {
                            this._playFromBeginning();
                        } else {
                            this._mediaElementAdapter.play();
                        }

                        this._updateUIAndRaiseEvents(mediaCommandEnum.play, strings.playMediaCommandDisplayText);
                    }
                },

                previousTrack: function () {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.previousTrack">
                    /// <summary locid="WinJS.UI.MediaPlayer.previousTrack">
                    /// Plays the previous track.
                    /// </summary>
                    /// </signature>

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:previousTrack,StartTM");

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.previousTrack) {
                        this._mediaElementAdapter.previousTrack();

                        this._exitFastForwardOrRewind(true);

                        this._updateUIAndRaiseEvents(mediaCommandEnum.previousTrack, strings.previousTrackMediaCommandDisplayText);
                    }
                },

                removeMarker: function (time) {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.removeMarker">
                    /// <summary locid="WinJS.UI.MediaPlayer.removeMarker">
                    /// Removes all chapter markers at the specified time.
                    /// </summary>
                    /// <param name="time" type="Object" locid="WinJS.UI.MediaPlayer.removeMarker_p:time">
                    /// The time of the marker to remove.
                    /// </param>
                    /// </signature>

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:removeMarker,StartTM");

                    var markersLength = this._markers.length;
                    for (var i = 0; i < markersLength; i++) {
                        if (this._markers[i].time === time) {
                            this._markers.splice(i, 1);
                            break;
                        }
                    }

                    // We need to reset the markersLength because a marker may have been removed
                    // so the length of the array has changed.
                    markersLength = this._markers.length;

                    // If we removed any of the markers that correspond to _nextCustomMarkerTime or  _previousCustomMarkerTime
                    // then we need to reset _nextCustomMarkerTime and _previousCustomMarkerTime. Otherwise we could fire
                    // an event for a non-existent marker.
                    if (this._nextCustomMarkerTime === time) {
                        if (this._nextCustomMarkerIndex < markersLength &&
                                this._markers[this._nextCustomMarkerIndex]) {
                            this._nextCustomMarkerTime = this._markers[this._nextCustomMarkerIndex].time;
                        } else {
                            this._nextCustomMarkerIndex = -1;
                            this._nextCustomMarkerTime = -1;
                        }
                    }
                    if (this._previousCustomMarkerTime === time) {
                        if (this._previousCustomMarkerIndex > 0 &&
                            this._markers[this._previousCustomMarkerTime]) {
                            this._previousCustomMarkerIndex--;
                            this._previousCustomMarkerTime = this._markers[this._previousCustomMarkerTime].time;
                        } else {
                            this._previousCustomMarkerIndex = -1;
                            this._previousCustomMarkerTime = -1;
                        }
                    }

                    if (this._markers.length === 0) {
                        this._hasCustomMarkers = false;
                        this._unsubscribeFromTimeUpdates();
                    }

                    this._isChapterMarkerVisualsDirty = true;
                    this._onMarkerCollectionChanged();

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:removeMarker,StopTM");
                },

                rewind: function () {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.rewind">
                    /// <summary locid="WinJS.UI.MediaPlayer.rewind">
                    /// Decreases the playbackRate of the media.
                    /// </summary>
                    /// </signature>

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:rewind,StartTM");

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {

                        if (this._mediaElementAdapter.mediaElement.readyState < this._MediaReadyState.MediaReadyState_Have_FutureData) {
                            return;
                        }

                        // We show the controls, because we need to give visual feedback to the user regarding timeline
                        // movement event if the API is called programmatically.
                        if (!this._controlsVisible) {
                            this._showControls();
                        }

                        var newPlaybackRate = null;
                        if (!this._isInFastForwardOrRewindMode) {
                            this._targetPlaybackRate = this._mediaElementAdapter.mediaElement.playbackRate;
                            this._targetCurrentTime = this._mediaElementAdapter.mediaElement.currentTime;
                        }

                        var currentPlaybackRate = this._PLAYBACKRATE_NOT_PLAYING;
                        if (this._simulatedFastForwardMode) {
                            currentPlaybackRate = this._targetPlaybackRate;
                        } else {
                            currentPlaybackRate = this._mediaElementAdapter.mediaElement.playbackRate;
                        }

                        // We have special behavior for pause. If the user is in the playing state and presses
                        // rewind, they will go into a slow motion state.
                        if (!this._isInFastForwardOrRewindMode &&
                            this._mediaElementAdapter.mediaElement.paused &&
                            currentPlaybackRate === this._PLAYBACKRATE_FAST_FORWARD_2X) {
                            newPlaybackRate = this._PLAYBACKRATE_FAST_FORWARD_SLOW_MOTION_RATE;
                        } else if (this._mediaElementAdapter.mediaElement.paused &&
                                   currentPlaybackRate === this._PLAYBACKRATE_FAST_FORWARD_SLOW_MOTION_RATE) {
                            newPlaybackRate = this._PLAYBACKRATE_PLAYING;
                        } else if (!this._isInFastForwardOrRewindMode &&
                                   this._mediaElementAdapter.mediaElement.paused &&
                                   currentPlaybackRate === this._PLAYBACKRATE_PLAYING) {
                            newPlaybackRate = this._PLAYBACKRATE_REWIND_SLOW_MOTION_RATE;
                        } else if (this._mediaElementAdapter.mediaElement.paused &&
                                   currentPlaybackRate === this._PLAYBACKRATE_REWIND_SLOW_MOTION_RATE) {
                            newPlaybackRate = this._PLAYBACKRATE_REWIND_2X;
                        } else if (currentPlaybackRate > this._PLAYBACKRATE_REWIND_MAX_RATE &&
                                   currentPlaybackRate <= this._PLAYBACKRATE_REWIND_2X) {
                            newPlaybackRate = Math.max(Math.floor(currentPlaybackRate) * 2, this._PLAYBACKRATE_REWIND_MAX_RATE);
                        } else if (currentPlaybackRate > this._PLAYBACKRATE_REWIND_2X &&
                                   currentPlaybackRate <= this._PLAYBACKRATE_PLAYING) {
                            newPlaybackRate = this._PLAYBACKRATE_REWIND_2X;
                        } else if (currentPlaybackRate > this._PLAYBACKRATE_PLAYING &&
                                   currentPlaybackRate <= this._PLAYBACKRATE_FAST_FORWARD_2X) {
                            newPlaybackRate = this._PLAYBACKRATE_PLAYING;
                        } else if (currentPlaybackRate > this._PLAYBACKRATE_FAST_FORWARD_2X &&
                                   currentPlaybackRate <= this._PLAYBACKRATE_FAST_FORWARD_MAX_RATE) {
                            newPlaybackRate = Math.min(Math.floor(currentPlaybackRate) / 2, this._PLAYBACKRATE_FAST_FORWARD_MAX_RATE);
                        }

                        if (newPlaybackRate) {
                            if (this._simulatedFastForwardMode) {
                                if (this._isFastForwardOrRewind(newPlaybackRate)) {
                                    var oldPlaybackRate = currentPlaybackRate;
                                    this._targetPlaybackRate = newPlaybackRate;
                                    this._updateFastForwardAndRewindState(oldPlaybackRate, newPlaybackRate);
                                } else {
                                    this._exitFastForwardOrRewind(true);
                                }
                            } else {
                                if (this._mediaElementAdapter.mediaElement.paused &&
                                    newPlaybackRate !== this._PLAYBACKRATE_PLAYING) {
                                    this._mediaElementAdapter.play();
                                }

                                this._mediaElementAdapter.mediaElement.playbackRate = newPlaybackRate;
                            }
                        }

                        this._setFastForwardOrRewindText();
                    }
                },

                seek: function (time) {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.seek">
                    /// <summary locid="WinJS.UI.MediaPlayer.seek">
                    /// Navigates to the specified position in the media.
                    /// </summary>
                    /// <param name="time" type="Number" locid="WinJS.UI.MediaPlayer.seek_p:time">
                    /// The position in seconds to seek to.
                    /// </param>
                    /// </signature>

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:seek,StartTM");

                    this._seekInternal(time, true);
                },

                setContentMetadata: function (contentType, metadata) {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.setContentMetadata">
                    /// <summary locid="WinJS.UI.MediaPlayer.setContentMetadata">
                    /// Sets the metadata fields for the given peice of media. This method should be called before changing the video stream.
                    /// </summary>
                    /// <param name="contentType" type="String" locid="WinJS.UI.MediaPlayer.setContentMetadata:contentType">
                    /// The type of content that will be played by the mediaPlayer.
                    /// </param>
                    /// <param name="metadata" type="Object" locid="WinJS.UI.MediaPlayer.setContentMetadata:metadata">
                    /// A collection of name value pairs that provide additional information about the current media.
                    /// </param>
                    /// <returns type="WinJS.Promise" locid="WinJS.UI.MediaPlayer.setContentMetadata_returnValue"> 
                    /// A promise which is successfully update the Content Metadata.The completion value indicates
                    /// content allowed to view based on family safety policy. Otherwise promise returns an error.
                    /// </returns>
                    /// </signature>

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:setContentMetadata,StartTM");

                    if (!contentType) {
                        throw new _ErrorFromName("WinJS.UI.MediaPlayer.nullContentType", strings.mediaPlayerNullContentType);
                    }

                    if (!metadata) {
                        throw new _ErrorFromName("WinJS.UI.MediaPlayer.nullMetadata", strings.mediaPlayerNullMetadata);
                    }

                    // Set the title & description in the UI
                    this._mediaMetadata = metadata;
                    this._mediaMetadata.contentType = contentType;
                    this._metadataTitle.textContent = this._mediaMetadata.title || "";
                    this._metadataDescription.textContent = this._mediaMetadata.description || "";

                    if (this._smtControls) {
                        var updater = this._smtControls.displayUpdater;
                        if (this._mediaElementAdapter.mediaElement &&
                            this._mediaElementAdapter.mediaElement.tagName === this._TAG_NAME_AUDIO) {
                            updater.type = _WinRT.Windows.Media.MediaPlaybackType.audio;
                        } else {
                            updater.type = _WinRT.Windows.Media.MediaPlaybackType.video;
                        }
                        updater.appMediaId = this._mediaMetadata.contentId;

                        // Set video properties
                        if (updater.type === _WinRT.Windows.Media.MediaPlaybackType.video) {
                            updater.videoProperties.title = this._mediaMetadata.title;
                        }

                        updater.update();
                    }

                    var that = this;
                    var isAllowedToViewContentBasedOnFamilySafetyPolicy = false;

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:setContentMetadata,StopTM");

                    return new Promise(function (complete, error, progress) {

                        var checkParentalControlsPromise = that._checkParentalControls()
                            .then(
                                function afterContentRatingCheckReturns(result) {
                                    if (result) {
                                        isAllowedToViewContentBasedOnFamilySafetyPolicy = true;
                                    } else {
                                        isAllowedToViewContentBasedOnFamilySafetyPolicy = false;
                                    }
                                });

                        Promise.join(checkParentalControlsPromise)
                            .then(
                                function success() {
                                    if (isAllowedToViewContentBasedOnFamilySafetyPolicy) {
                                        complete();
                                    } else {
                                        error();
                                    }
                                },
                                function errorHandler() {
                                    error();
                                });
                    });
                },

                showControls: function () {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.showControls">
                    /// <summary locid="WinJS.UI.MediaPlayer.showControls">
                    /// Displays the UI associated with the MediaPlayer.
                    /// </summary>
                    /// </signature>

                    this._showControls(false);
                },

                forceLayout: function () {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.forceLayout">
                    /// <summary locid="WinJS.UI.MediaPlayer.forceLayout">
                    /// Forces the toolbar update its layout and redraws the control.
                    /// </summary>
                    /// </signature>
                    if (this._toolbar) {
                        this._toolbar.forceLayout();
                    }
                },

                stop: function () {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.stop">
                    /// <summary locid="WinJS.UI.MediaPlayer.stop">
                    /// Stops the media.
                    /// </summary>
                    /// </signature>

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.stop) {
                        this._mediaElementAdapter.stop();
                        this._updateUIAndRaiseEvents(mediaCommandEnum.stop, strings.stopMediaCommandDisplayText);
                    }
                },

                timeSkipBack: function () {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.timeSkipBack">
                    /// <summary locid="WinJS.UI.MediaPlayer.timeSkipBack">
                    /// Moves the current timeline position backward by a short interval.
                    /// </summary>
                    /// </signature>

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:timeSkipBack,StartTM");

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {

                        this._exitFastForwardOrRewind(true);

                        // Note: Unlike the other media commands, which simply pass the command through to the MediaElementAdapter,
                        // the timeSkipBack command's logic is handled at the MediaPlayer layer, to ensure the interval of time
                        // to skip back is the same no matter what MediaElementAdapter is used.
                        var newTime = this._mediaElementAdapter.mediaElement.currentTime - this._SKIP_BACK_INTERVAL;

                        if (newTime < this._startTime) {
                            newTime = this._startTime;
                        }

                        this._seekInternal(newTime, false);

                        this._updateUIAndRaiseEvents(mediaCommandEnum.timeSkipBack, strings.timeSkipBackMediaCommandDisplayText);

                        _WriteProfilerMark("WinJS.UI.MediaPlayer:timeSkipBack,StopTM");
                    }
                },

                timeSkipForward: function () {
                    /// <signature helpKeyword="WinJS.UI.MediaPlayer.timeSkipForward">
                    /// <summary locid="WinJS.UI.MediaPlayer.timeSkipForward">
                    /// Moves the current timeline position forward a short interval.
                    /// </summary>
                    /// </signature>

                    _WriteProfilerMark("WinJS.UI.MediaPlayer:timeSkipForward,StartTM");

                    if (this._mediaElementAdapter &&
                        this._mediaElementAdapter.mediaElement) {

                        this._exitFastForwardOrRewind(true);

                        // Note: Unlike the other media commands, which simply pass the command through to the MediaElementAdapter,
                        // the timeSkipForward command's logic is handled at the MediaPlayer layer, to ensure the interval of time
                        // to skip forward is the same no matter what MediaElementAdapter is used.
                        var newTime = this._mediaElementAdapter.mediaElement.currentTime + this._SKIP_FORWARD_INTERVAL;

                        if (newTime > this._endTime) {
                            newTime = this._endTime;
                        }

                        this._seekInternal(newTime, false);

                        this._updateUIAndRaiseEvents(mediaCommandEnum.timeSkipForward, strings.timeSkipForwardMediaCommandDisplayText);

                        _WriteProfilerMark("WinJS.UI.MediaPlayer:timeSkipForward,StopTM");
                    }
                },
                _MediaReadyState: {
                    MediaReadyState_Have_Nothing: 0,
                    MediaReadyState_Have_Metadata: 1,
                    MediaReadyState_Have_CurrentData: 2,
                    MediaReadyState_Have_FutureData: 3,
                    MediaReadyState_Have_EnoughData: 4
                }
            },
                {
                    // keep it for Xbox Legacy..
                    _sounds: {
                        initialized: false,
                        elementFocus1: null,
                        elementFocus2: null,
                        elementFocus3: null,
                        elementFocus4: null,
                        selectButtonClick: null,
                        overlayIn: null,
                        overlayOut: null,
                    },
                });
            _Base.Class.mix(MediaPlayer, _Events.createEventProperties(
               "beforeshowcontrols",
               "aftershowcontrols",
               "beforehidecontrols",
               "afterhidecontrols",
               "markerreached",
               "mediacommandexecuted",
               "targetratechange",
               "targettimeupdate",
               "thumbnailrequest"));
            _Base.Class.mix(MediaPlayer, _Control.DOMEventMixin);
            return MediaPlayer;
        })
    });
});