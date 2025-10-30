export async function sleep(ms: number) {
  return await new Promise((resolve: any) => {
    setTimeout(() => {
      return resolve(true);
    }, ms);
  });
}

export const parseXML = (xml) => {
  const dataList = [];
  const regex = /<Data\s+([^>]+?)\/>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const attrs = match[1];
    const obj: any = {};

    // Tách từng cặp key="value"
    const attrRegex = /(\w+)="([^"]*)"/g;
    let pair;
    while ((pair = attrRegex.exec(attrs)) !== null) {
      const key = pair[1];
      const value = pair[2];

      // Bỏ prefix như n_1, k_1 => chỉ lấy phần đầu
      const baseKey = key;
      obj[key] = value;
      obj[baseKey] = value; // giữ luôn key chung để dễ dùng
    }

    // Gom thành object theo chuẩn
    dataList.push({
      ...obj,
    });
  }

  return dataList;
};

export const uuidv4 = (): string => {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16),
  );
};

export const payloadFromToken = (jwtToken: string) => {
  try {
    const parts = jwtToken.replace('Bearer ', '').split('.');
    const encodedPayload = parts[1];

    // Decode the Base64Url encoded payload
    const decodedPayload = atob(encodedPayload);

    // Parse the JSON string into an object
    return JSON.parse(decodedPayload);
  } catch (e) {
    return {};
  }
};

export const normalizeText = (input: string): string => {
  return input
    .replace(/[\x00-\x1F\x7F]+/g, (m) => (m.length ? '. ' : ''))
    .replace(/\.{2,}/g, '.')
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
    .replace(/\s+/g, ' ') // Xóa các khoảng trắng liền nhau
    .replace(/^\. +|\. +$/g, '')
    .trim(); // Xóa khoảng trắng ở đầu và cuối chuỗi
};

export const _tokenize = (text: string) => {
  text = text.replace(/(\d)[.,](?=\d)/g, (match, p1) => {
    return match.includes('.') ? `${p1}_dot_` : `${p1}_comma_`;
  });
  text = text.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '__dash__');
  const sp = text.split('');
  if (!'.,!?。！？、'.includes(sp[sp.length - 1])) {
    text = `${text}.`;
  }

  const segments = [];
  const regex = /([^.,!?。！？、]+)([.,!?。！？、]+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const str = match[1].trim();
    if (/^[.,!?。！？、]+$/.test(str) === false) {
      const text = str
        .replaceAll('\\', '')
        .replaceAll('_comma_', ',')
        .replaceAll('_dot_', '.')
        .replaceAll('__dash__', '-');
      segments.push({
        text,
        punctuation: match[2].trim(),
      });
    }
  }
  return splitAtNearestWord(mergeText(segments, 200), 200);
};
function splitAtNearestWord(data: string[], maxLength = 200) {
  const result = [];

  data.forEach((item) => {
    if (item.length > maxLength) {
      let splits = splitText(item, maxLength, []);
      splits.forEach((resultSplit) => {
        result.push(resultSplit);
      });
    } else {
      result.push(item);
    }
  });

  return result;
}

function splitText(item, maxLength, result = []) {
  if (item.length <= maxLength) {
    if (item.trim()) result.push(item.trim());
    return result;
  }

  const text = item;
  const splitIndex = text.lastIndexOf(' ', maxLength);

  if (splitIndex !== -1) {
    const part1 = text.slice(0, splitIndex).trim();
    const part2 = text.slice(splitIndex).trim();
    if (part1) result.push(part1);
    return splitText(part2, maxLength, result);
  } else {
    const part1 = text.slice(0, maxLength).trim();
    const part2 = text.slice(maxLength).trim();
    if (part1) result.push(part1);
    return splitText(part2, maxLength, result);
  }
}
const mergeText = (arr: any, maxLength: number) => {
  const result = [];
  let tempText = arr[0].text + arr[0].punctuation;
  let tempPunctuation = arr[0].punctuation;

  for (let i = 1; i < arr.length; i++) {
    // If the combined length does not exceed maxLength
    if (
      tempText.length + arr[i].text.length + arr[i].punctuation.length <=
      maxLength
    ) {
      tempText += ' ' + arr[i].text + arr[i].punctuation;
      tempPunctuation = arr[i].punctuation; // Update punctuation
    } else {
      // If punctuation is a period, push the current combined text and start a new one
      result.push(tempText.trim());
      tempText = arr[i].text + arr[i].punctuation;
      tempPunctuation = arr[i].punctuation;
    }

    // If the punctuation is a period, push the current text and stop merging further
    if (['.', '!', '?'].indexOf(tempPunctuation) !== -1) {
      result.push(tempText.trim());
      tempText = '';
      tempPunctuation = '';
    }
  }

  // Add the last part if it's not empty
  if (tempText) {
    result.push(tempText.trim());
  }

  return result.map((item) => normalizeText(item));
};
