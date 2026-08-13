import config from '@src/config';
import { CLIENT_ID } from '@src/common/clientId';
import { Inversify } from '@src/common/inversify';
import { GraphqlService } from '@happykiller/sunny-ui';

export class GraphqlServiceFetch implements GraphqlService {
  constructor(private inversify: Inversify) {}

  async send(datas: any): Promise<any> {
    try {
      const storedSession = await this.inversify.storageService.getItem(
        config.local_storage_name,
      );
      const storage = storedSession ? JSON.parse(storedSession) : null;
      const token = storage?.state.access_token;

      const response = await fetch(config.api_url, {
        method: 'POST',
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? 'token'}`,
          // Le serveur recopie cette valeur dans les événements que la requête
          // provoque, pour que cet onglet reconnaisse son propre écho — voir
          // `clientId.ts`. Un seul endroit à poser : toutes les mutations du
          // front passent par ici.
          'x-gold-client': CLIENT_ID,
        },
        body: JSON.stringify(datas),
      });

      const responseJson = response.json();

      return responseJson;
    } catch (e: any) {
      this.inversify.loggerService.error(e.message);
    }
  }
}
