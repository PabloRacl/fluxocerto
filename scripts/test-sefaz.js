const https = require('https');
const { XMLParser } = require('fast-xml-parser');

const chave = '26260306057223042761650220001028001221544100';
const url = 'https://nfce.sefaz.pe.gov.br/nfce/consulta?p=' + chave + '|3|1';

https
  .get(
    url,
    {
      headers: {
        Accept: 'application/xml,text/xml,*/*',
        'User-Agent': 'fluxocerto-nfce-importer/1.0',
      },
    },
    (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        console.log('status', resp.statusCode, 'len', data.length);
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '',
          removeNSPrefix: true,
          allowBooleanAttributes: true,
          isArray: (name) => name === 'det',
        });
        const parsed = parser.parse(data);
        const infNFe =
          parsed?.nfeProc?.proc?.nfeProc?.NFe?.infNFe ||
          parsed?.nfeProc?.proc?.nfeProc?.infNFe ||
          null;
        console.log('infNFe', !!infNFe);
        const det = infNFe?.det || [];
        const parse = (v) => {
          if (v === undefined || v === null) return 0;
          let s = String(v).trim();
          s = s.replace(/\./g, '').replace(/,/g, '.');
          const n = Number(s);
          return Number.isNaN(n) ? 0 : n;
        };
        const items = (Array.isArray(det) ? det : [det])
          .filter(Boolean)
          .map((item) => {
            const prod = item?.prod || {};
            return {
              name: String(prod.xProd || '').trim(),
              q: parse(prod.qCom || prod.qTrib || 0),
              unitPrice: parse(prod.vUnCom || prod.vUnTrib || 0),
              total: parse(prod.vProd || 0),
            };
          });
        console.log('items', items.length, items[0]);
        console.log('vNF', infNFe?.total?.ICMSTot?.vNF);
      });
    },
  )
  .on('error', (e) => {
    console.error('err', e);
  });
