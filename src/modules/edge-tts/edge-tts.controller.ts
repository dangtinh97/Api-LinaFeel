import { Controller, Post, Req, Res } from '@nestjs/common';
import {
  UniversalEdgeTTS,
  UniversalCommunicate,
  UniversalVoicesManager,
  listVoicesUniversal,
} from 'edge-tts-universal';
@Controller('tts')
export class EdgeTtsController {
  @Post('/edge')
  async createAudio(@Req() req: any, @Res() res: any) {
    //https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts#standard-voices
    const { text, language } = req.body;
    const voices = {
      'vi-VN': 'vi-VN-NamMinhNeural',
      'en-US': 'en-US-EmmaMultilingualNeural'
    }
    const tts = new UniversalEdgeTTS(
      text,
      voices[language] ?? voices['vi-VN'],
    );
    const result = await tts.synthesize();
    const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'inline; filename="speech.mp3"',
      'Content-Length': audioBuffer.length,
    });

    res.send(audioBuffer);
  }
}
