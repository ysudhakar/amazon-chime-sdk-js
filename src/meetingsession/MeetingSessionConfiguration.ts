// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import ConnectionHealthPolicyConfiguration from '../connectionhealthpolicy/ConnectionHealthPolicyConfiguration';
import ScreenSharingSessionOptions from '../screensharingsession/ScreenSharingSessionOptions';
import AllHighestVideoBandwidthPolicy from '../videodownlinkbandwidthpolicy/AllHighestVideoBandwidthPolicy';
import VideoDownlinkBandwidthPolicy from '../videodownlinkbandwidthpolicy/VideoDownlinkBandwidthPolicy';
import NScaleVideoUplinkBandwidthPolicy from '../videouplinkbandwidthpolicy/NScaleVideoUplinkBandwidthPolicy';
import VideoUplinkBandwidthPolicy from '../videouplinkbandwidthpolicy/VideoUplinkBandwidthPolicy';
import MeetingSessionCredentials from './MeetingSessionCredentials';
import MeetingSessionURLs from './MeetingSessionURLs';

/**
 * [[MeetingSessionConfiguration]] contains the information necessary to start
 * a session.
 */
export default class MeetingSessionConfiguration {
  /**
   * The id of the meeting the session is joining.
   */
  meetingId: string | null = null;

  /**
   * The credentials used to authenticate the session.
   */
  credentials: MeetingSessionCredentials | null = null;

  /**
   * The URLs the session uses to reach the meeting service.
   */
  urls: MeetingSessionURLs | null = null;

  /**
   * Maximum amount of time in milliseconds to allow for connecting.
   */
  connectionTimeoutMs: number = 15000;

  /**
   * Maximum amount of time in milliseconds to allow for a screen sharing connection.
   */
  screenSharingTimeoutMs: number = 5000;

  /**
   * Maximum amount of time in milliseconds to allow for a screen viewing connection.
   */
  screenViewingTimeoutMs: number = 5000;

  /**
   * Maximum amount of time in milliseconds to wait for the current attendee to be present
   * after initial connection.
   */
  attendeePresenceTimeoutMs: number = 0;

  /**
   * Screen sharing session options.
   */
  screenSharingSessionOptions: ScreenSharingSessionOptions = {};

  /**
   * Configuration for connection health policies: reconnection, unusable audio warning connection,
   * and signal strength bars connection.
   */
  connectionHealthPolicyConfiguration: ConnectionHealthPolicyConfiguration = new ConnectionHealthPolicyConfiguration();

  /**
   * Feature flag to enable WebAudio processing
   */
  enableWebAudio: boolean = false;

  /**
   * Feature flag to enable Chromium-based browsers
   */
  enableUnifiedPlanForChromiumBasedBrowsers: boolean = true;

  /**
   * Feature flag to enable Simulcast
   */
  enableSimulcastForUnifiedPlanChromiumBasedBrowsers: boolean = false;

  /**
   * Video downlink bandwidth policy to determine which remote videos
   * are subscribed to.
   */
  videoDownlinkBandwidthPolicy: VideoDownlinkBandwidthPolicy = null;

  /**
   * Video uplink bandwidth policy to determine the bandwidth constraints
   * of the local video.
   */
  videoUplinkBandwidthPolicy: VideoUplinkBandwidthPolicy = null;

  /**
   * Constructs a MeetingSessionConfiguration optionally with a chime:CreateMeeting and
   * chime:CreateAttendee response. You can pass in either a JSON object containing the
   * responses, or a JSON object containing the information in the Meeting and Attendee
   * root-level fields. Examples:
   *
   * ```
   * const configuration = new MeetingSessionConfiguration({
   *   "Meeting": {
   *      "MeetingId": "...",
   *      "MediaPlacement": {
   *        "AudioHostUrl": "...",
   *        "ScreenDataUrl": "...",
   *        "ScreenSharingUrl": "...",
   *        "ScreenViewingUrl": "...",
   *        "SignalingUrl": "...",
   *        "TurnControlUrl": "..."
   *      }
   *    }
   *   }
   * }, {
   *   "Attendee": {
   *     "ExternalUserId": "...",
   *     "AttendeeId": "...",
   *     "JoinToken": "..."
   *   }
   * });
   * ```
   *
   * ```
   * const configuration = new MeetingSessionConfiguration({
   *   "MeetingId": "...",
   *   "MediaPlacement": {
   *     "AudioHostUrl": "...",
   *     "ScreenDataUrl": "...",
   *     "ScreenSharingUrl": "...",
   *     "ScreenViewingUrl": "...",
   *     "SignalingUrl": "...",
   *     "TurnControlUrl": "..."
   *   }
   * }, {
   *   "ExternalUserId": "...",
   *   "AttendeeId": "...",
   *   "JoinToken": "..."
   * });
   * ```
   */
  constructor(createMeetingResponse?: any, createAttendeeResponse?: any) { // eslint-disable-line
    if (createAttendeeResponse) {
      createAttendeeResponse = this.convertMapToObject(
        this.toLowerCasePropertyNames(createAttendeeResponse)
      );
    }
    if (createMeetingResponse) {
      createMeetingResponse = this.convertMapToObject(
        this.toLowerCasePropertyNames(createMeetingResponse)
      );
      if (createMeetingResponse.meeting) {
        createMeetingResponse = createMeetingResponse.meeting;
      }
      this.meetingId = createMeetingResponse.meetingid;
      this.urls = new MeetingSessionURLs();
      this.urls.audioHostURL = createMeetingResponse.mediaplacement.audiohosturl;
      this.urls.screenDataURL = createMeetingResponse.mediaplacement.screendataurl;
      this.urls.screenSharingURL = createMeetingResponse.mediaplacement.screensharingurl;
      this.urls.screenViewingURL = createMeetingResponse.mediaplacement.screenviewingurl;
      this.urls.signalingURL = createMeetingResponse.mediaplacement.signalingurl;
      this.urls.turnControlURL = createMeetingResponse.mediaplacement.turncontrolurl;
    }
    if (createAttendeeResponse) {
      if (createAttendeeResponse.attendee) {
        createAttendeeResponse = createAttendeeResponse.attendee;
      }
      this.credentials = new MeetingSessionCredentials();
      this.credentials.attendeeId = createAttendeeResponse.attendeeid;
      this.credentials.externalUserId = createAttendeeResponse.externaluserid;
      this.credentials.joinToken = createAttendeeResponse.jointoken;
    }
    if (new DefaultBrowserBehavior().screenShareSendsOnlyKeyframes()) {
      this.screenSharingSessionOptions = { bitRate: 384000 };
    }

    // simulcast feature flag will override the following policies when DefaultAudioVideoController is created
    this.videoDownlinkBandwidthPolicy = new AllHighestVideoBandwidthPolicy(
      this.credentials ? this.credentials.attendeeId : null
    );
    this.videoUplinkBandwidthPolicy = new NScaleVideoUplinkBandwidthPolicy(
      this.credentials ? this.credentials.attendeeId : null
    );
  }

  private toLowerCasePropertyNames(jsonObject: any) { // eslint-disable-line
    const output = new Map();
    for (const key in jsonObject) {
      if (Object.prototype.toString.apply(jsonObject[key]) === '[object Object]') {
        output.set(key.toLowerCase(), this.toLowerCasePropertyNames(jsonObject[key]));
      } /* istanbul ignore else */ else if (
        Object.prototype.toString.apply(jsonObject[key]) === '[object String]'
      ) {
        output.set(key.toLowerCase(), jsonObject[key]);
      }
    }
    return output;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertMapToObject(map: any): JSON {
    const obj = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.forEach((value: any, key: string) => {
      if (value instanceof Map) {
        // @ts-ignore
        obj[key] = this.convertMapToObject(value);
      } else {
        // @ts-ignore
        obj[key] = value;
      }
    });
    return JSON.parse(JSON.stringify(obj));
  }
}
