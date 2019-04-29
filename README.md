# VoiceBot

VoiceBot is a discord bot that support voice commands.

Invite the bot to your channel and then pronounce `{keyword} play {song name}` to play your favorite song!

## How to use

NOTE: This project is in an alpha stage an relies on a native N-API module [native-voice-command-detector](https://github.com/Vagr9K/native-voice-command-detector) for high performance, multithreaded hotword detection and speech recognition. Consult [its documentation](https://github.com/Vagr9K/native-voice-command-detector#building) on how to build it.

To use the bot:

- Setup a `.env` configuration file:

  ```
    DISCORD_BOT_TOKEN=YOUR_BOT_TOKEN
    DISCORD_BOT_PREFIX='terminator ' # Or any other prefix used for text commands
    YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY # For searching songs
    GCLOUD_SPEECH_TO_TEXT_API_KEY=YOUR_CLOUD_KEY # For native-voice-command-detector
    PV_KEYWORD_PATH= # For native-voice-command-detector
    PV_MODEL_PATH= # For native-voice-command-detector
    PV_SENSITIVITY=0.5 # For native-voice-command-detector
    MAX_VOICE_BUFFER_TTL=200 # For native-voice-command-detector
    MAX_COMMAND_LENGTH=3000 # For native-voice-command-detector
    MAX_COMMAND_SILENCE_LENGTH=1000 # For native-voice-command-detector
  ```

  Consult [native-voice-command-detector](https://github.com/Vagr9K/native-voice-command-detector) documentation for the explanation of the last parameters.

- Install the dependencies via `yarn`
- Launch the bot via `yarn start`

## Copyright

Copyright (c) 2019 Ruben Harutyunyan
