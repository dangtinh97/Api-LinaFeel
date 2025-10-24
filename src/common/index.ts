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
    const parts = jwtToken.replace('Bearer ','').split('.');
    const encodedPayload = parts[1];

    // Decode the Base64Url encoded payload
    const decodedPayload = atob(encodedPayload);

    // Parse the JSON string into an object
    return JSON.parse(decodedPayload);
  } catch (e) {
    return {};
  }
};
