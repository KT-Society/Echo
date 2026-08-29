> ## Documentation Index
> Fetch the complete documentation index at: https://docs.sunoapi.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Replace Music Section

> Replace a specific time segment within existing music.

### Usage Guide

* This interface can replace specific time segments in already generated music
* Requires providing the original music's task ID and the time range to be replaced, or a user-uploaded audio URL with a model version
* The replaced audio will naturally blend with the original music

### Two Modes of Operation

**Mode 1: Using existing audio**

* Provide `taskId` and `audioId` to replace a section in previously generated music

**Mode 2: Using uploaded custom audio**

* Provide `uploadUrl` and `model` to replace a section using your own uploaded audio

### Parameter Details

* **Common Required Parameters**:
  * `prompt`: Replaced lyrics
  * `tags`: Music style tags
  * `title`: Music title
  * `infillStartS`: Start time point for replacement (seconds, 2 decimal places)
  * `infillEndS`: End time point for replacement (seconds, 2 decimal places)
  * `fullLyrics`: Complete lyrics after modification, combining both modified and unmodified lyrics

* **Mode 1 Required Parameters**:
  * `taskId`: Original music's parent task ID
  * `audioId`: Audio ID to replace (returned in callback data after generation)

* **Mode 2 Required Parameters**:
  * `uploadUrl`: URL of the custom audio uploaded by the user
  * `model`: AI model version (V4, V4\_5, V4\_5PLUS, V4\_5ALL, V5, V5\_5)

* **Optional Parameters**:
  * `negativeTags`: Music styles to exclude
  * `callBackUrl`: Callback URL after task completion

### Time Range Instructions

* `infillStartS` must be less than `infillEndS`
* Time values are precise to 2 decimal places, e.g., 10.50 seconds
* The replacement time must be at least **10 seconds**.
* Replacement duration should not exceed 50% of the original music's total duration

### Developer Notes

* Replacement segments will be regenerated based on the provided `prompt` and `tags`
* Generated replacement segments will automatically blend with the original music's preceding and following parts
* Generated files will be retained for **14 days**
* Query task status using the same interface as generating music: [Get Music Details](./get-music-generation-details)


## OpenAPI

````yaml suno-api/suno-api.json POST /api/v1/generate/replace-section
openapi: 3.0.0
info:
  title: intro
  description: API documentation for audio generation services
  version: 1.0.0
  contact:
    name: Technical Support
    email: support@sunoapi.org
servers:
  - url: https://api.sunoapi.org
    description: API Server
security:
  - BearerAuth: []
tags:
  - name: Music Generation
    description: Endpoints for creating and managing music generation tasks
  - name: Lyrics Generation
    description: Endpoints for lyrics generation and management
  - name: WAV Conversion
    description: Endpoints for converting music to WAV format
  - name: Vocal Removal
    description: Endpoints for vocal removal from music tracks
  - name: Music Video Generation
    description: Endpoints for generating MP4 videos from music tracks
  - name: Account Management
    description: Endpoints for account and credits management
paths:
  /api/v1/generate/replace-section:
    post:
      tags:
        - Music Generation
      summary: Replace Music Section
      description: >-
        Replace a specific time segment within existing music.


        This interface can replace specific time segments in already generated
        music. It requires providing the original music's task ID and the time
        range to be replaced. The replaced audio will naturally blend with the
        original music.


        ### Time Range Instructions

        - `infillStartS` must be less than `infillEndS`.

        - Time values are precise to 2 decimal places, e.g., `10.50` seconds.

        - The replacement time must be at least **10 seconds**.

        - Replacement duration should not exceed **50%** of the original music's
        total duration.


        ### Developer Notes

        - Replacement segments will be regenerated based on the provided
        `prompt` and `tags`.

        - Generated replacement segments will automatically blend with the
        original music's preceding and following parts.

        - Generated files will be retained for **14 days**.

        - Query task status using the same interface as generating music: [Get
        Music Details](/suno-api/get-music-generation-details).
      operationId: replace-section
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - prompt
                - tags
                - title
                - infillStartS
                - infillEndS
                - fullLyrics
              oneOf:
                - title: Replace section using existing audio
                  required:
                    - taskId
                    - audioId
                  type: object
                  properties:
                    taskId:
                      type: string
                      description: >-
                        Original task ID (parent task), used to identify the
                        source music for section replacement.
                      example: 2fac****9f72
                    audioId:
                      type: string
                      description: >-
                        Unique identifier of the audio track to replace. This ID
                        is returned in the callback data after music generation
                        completes.
                      example: e231****-****-****-****-****8cadc7dc
                - title: Replace section using uploaded custom audio
                  required:
                    - uploadUrl
                    - model
                  type: object
                  properties:
                    uploadUrl:
                      type: string
                      format: uri
                      description: URL of the custom audio uploaded by the user.
                      example: https://example.com/audio.mp3
                    model:
                      type: string
                      description: |-
                        AI model version used for generation.
                        - Available options:
                          - **`V5_5`**: A tailor-made exclusive model that fits your unique taste.
                          - **`V5`**: Better musical expressiveness with faster generation speed.
                          - **`V4_5PLUS`**: V4.5+ with richer timbre, new creative methods, up to 8 minutes.
                          - **`V4_5`**: V4.5 with smarter prompts, faster generation speed, up to 8 minutes.
                          - **`V4_5ALL`**: V4.5ALL with smarter prompts, faster generation speed, up to 8 minutes.
                          - **`V4`**: V4 with improved vocal quality, up to 4 minutes.
                      enum:
                        - V4
                        - V4_5
                        - V4_5PLUS
                        - V4_5ALL
                        - V5
                        - V5_5
                      example: V4
              properties:
                prompt:
                  type: string
                  description: Replaced lyrics
                  example: A calm and relaxing piano track.
                tags:
                  type: string
                  description: Music style tags, such as jazz, electronic, etc.
                  example: Jazz
                title:
                  type: string
                  description: Music title
                  example: Relaxing Piano
                negativeTags:
                  type: string
                  description: >-
                    Excluded music styles, used to avoid specific style elements
                    in the replacement segment
                  example: Rock
                infillStartS:
                  type: number
                  description: >-
                    Start time point for replacement (seconds), 2 decimal
                    places. Must be less than infillEndS. The time interval
                    (infillEndS - infillStartS) must be at least 10 seconds.
                  minimum: 0
                  example: 10.5
                infillEndS:
                  type: number
                  description: >-
                    End time point for replacement (seconds), 2 decimal places.
                    Must be greater than infillStartS. The time interval
                    (infillEndS - infillStartS) must be at least 10 seconds.
                  minimum: 0
                  example: 20.75
                fullLyrics:
                  type: string
                  description: >-
                    Complete lyrics after modification, combining both modified
                    and unmodified lyrics. This parameter contains the full
                    lyrics text that will be used for the entire song after the
                    section replacement.
                  example: |-
                    [Verse 1]
                    Original lyrics here
                    [Chorus]
                    Modified lyrics for this section
                    [Verse 2]
                    More original lyrics
                callBackUrl:
                  type: string
                  format: uri
                  description: >-
                    Callback URL for task completion. The system will send a
                    POST request to this URL when replacement is complete,
                    containing task status and results.


                    - Your callback endpoint should be able to accept POST
                    requests containing JSON payloads with replacement results

                    - For detailed callback format and implementation guide, see
                    [Replace Music Section
                    Callbacks](/suno-api/replace-section-callbacks)

                    - Alternatively, you can use the [Get Music Generation
                    Details](/suno-api/get-music-generation-details) endpoint to
                    poll task status
                  example: https://example.com/callback
            example:
              taskId: 2fac****9f72
              audioId: e231****-****-****-****-****8cadc7dc
              prompt: A calm and relaxing piano track.
              tags: Jazz
              title: Relaxing Piano
              negativeTags: Rock
              infillStartS: 10.5
              infillEndS: 20.75
              fullLyrics: |-
                [Verse 1]
                Original lyrics here
                [Chorus]
                Modified lyrics for this section
                [Verse 2]
                More original lyrics
              callBackUrl: https://example.com/callback
      responses:
        '200':
          description: Request successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    enum:
                      - 200
                      - 401
                      - 402
                      - 404
                      - 409
                      - 422
                      - 429
                      - 451
                      - 455
                      - 500
                    description: >-
                      Response status code


                      - **200**: Success - Request processed successfully

                      - **401**: Unauthorized - Authentication credentials
                      missing or invalid

                      - **402**: Insufficient credits - Account does not have
                      enough credits to perform this operation

                      - **404**: Not found - Requested resource or endpoint does
                      not exist

                      - **409**: Conflict - WAV record already exists

                      - **422**: Validation error - Request parameters failed
                      validation checks

                      - **429**: Rate limit exceeded - Exceeded request limit
                      for this resource

                      - **451**: Unauthorized - Failed to retrieve image. Please
                      verify any access restrictions set by you or your service
                      provider.

                      - **455**: Service unavailable - System is currently
                      undergoing maintenance

                      - **500**: Server error - Unexpected error occurred while
                      processing request
                  msg:
                    type: string
                    description: Error message when code != 200
                    example: success
                  data:
                    type: object
                    properties:
                      taskId:
                        type: string
                        description: >-
                          Task ID for tracking task status. You can use this ID
                          to query task details and results through the [Get
                          Music Generation
                          Details](/suno-api/get-music-generation-details)
                          interface.
                        example: 5c79****be8e
        '500':
          description: Request failed
          content:
            application/json:
              schema:
                type: object
                required:
                  - code
                  - msg
                  - data
                properties:
                  code:
                    type: integer
                    description: >-
                      Response status code


                      - **200**: Success - Request has been processed
                      successfully

                      - **401**: Unauthorized - Authentication credentials are
                      missing or invalid

                      - **402**: Insufficient Credits - Account does not have
                      enough credits to perform the operation

                      - **404**: Not Found - The requested resource or endpoint
                      does not exist

                      - **408**: Upstream is currently experiencing service
                      issues. No result has been returned for over 10 minutes.

                      - **422**: Validation Error - The request parameters
                      failed validation checks

                      - **429**: Rate Limited - Request limit has been exceeded
                      for this resource

                      - **455**: Service Unavailable - System is currently
                      undergoing maintenance

                      - **500**: Server Error - An unexpected error occurred
                      while processing the request

                      - **501**: Generation Failed - Content generation task
                      failed

                      - **505**: Feature Disabled - The requested feature is
                      currently disabled
                  msg:
                    type: string
                    description: Response message, error description when failed
                  data:
                    type: object
                    properties: {}
              example:
                code: 500
                msg: >-
                  Server Error - An unexpected error occurred while processing
                  the request
                data: null
      security:
        - BearerAuth: []
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: API Key
      description: >-
        # 🔑 API Authentication


        All endpoints require authentication using Bearer Token.


        ## Get API Key


        1. Visit the [API Key Management Page](https://sunoapi.org/api-key) to
        obtain your API Key


        ## Usage


        Add to request headers:


        ```

        Authorization: Bearer YOUR_API_KEY

        ```


        > **⚠️ Note:**

        > - Keep your API Key secure and do not share it with others

        > - If you suspect your API Key has been compromised, reset it
        immediately from the management page

````