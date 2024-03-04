import config from '@src/config';
import { Inversify } from '@src/common/inversify';
import GraphqlService from '@service/graphql/graphql.service';

export class GraphqlServiceFetch implements GraphqlService {

  constructor(
    private inversify:Inversify
  ){}

  async send(datas: any): Promise<any> {
    try {
      const storage = JSON.parse(localStorage.getItem("gold-storage"));
      const token = storage?.state.access_token;

      const response = await fetch(config.api_url, {
        method: 'POST',
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token??'token'}`
        },
        body: JSON.stringify(datas)
      });

      const responseJson = response.json();

      return responseJson;
    } catch(e:any) {
      this.inversify.loggerService.error(e.message);
    }
  }
} 