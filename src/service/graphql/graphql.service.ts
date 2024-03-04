export default abstract class GraphqlService {
  abstract send(datas: any): Promise<any>;
}