import { Controller, Post, Req, Res } from '@nestjs/common';
import { UniversalEdgeTTS } from 'edge-tts-universal';
import { _tokenize, normalizeText } from '../../common';
import * as _ from 'lodash';
@Controller('tts')
export class EdgeTtsController {
  @Post('/google')
  async createAudio(@Req() req: any, @Res() res: any) {
    //https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts#standard-voices
    const { text, language } = req.body;
    const [langCode, langCountry] = language.split('-');
    console.log(langCountry);
    const audioBuffer = await this.gtts(text, langCode);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'inline; filename="speech.mp3"',
      'Content-Length': audioBuffer.length,
    });

    res.send(audioBuffer);
  }

  async edgeTts(text: string, language: string) {
    const voices = {
      'vi-VN': 'vi-VN-NamMinhNeural',
      'en-US': 'en-US-EmmaMultilingualNeural',
    };
    const tts = new UniversalEdgeTTS(text, voices[language] ?? voices['vi-VN']);
    const result = await tts.synthesize();
    return Buffer.from(await result.audio.arrayBuffer());
  }

  async gtts(text: string, language: string) {
    text = normalizeText(text);
    const data = text.length < 200 ? [text] : _tokenize(text);
    const p = await Promise.all(
      data.map((item) => this.curlToGoogle(item, language)),
    );
    return await this.combineBase64Audio(p);
  }

  async curlToGoogle(text: string, language: string) {
    try {
      text = encodeURIComponent(encodeURIComponent(text));
      const url = `https://www.google.com/async/translate_tts?ttsp=tl:${language},txt:${text},spd:1.5&async=_fmt:jspb`;
      const curl = await fetch(url);
      const body = await curl.text();
      const json = body.replace(")]}'", '');
      return _.get(JSON.parse(json), 'translate_tts.0');
    } catch (error) {
      console.log(text, 'error');
      return null;
    }
  }

  async combineBase64Audio(base64Array: string[]): Promise<Buffer> {
    // Convert each base64 string to binary and concatenate them
    const combinedBuffer = base64Array.reduce((acc, base64Data) => {
      const buffer = Buffer.from(base64Data, 'base64');
      return Buffer.concat([acc, buffer]);
    }, Buffer.alloc(0));

    return combinedBuffer;
  }
}
