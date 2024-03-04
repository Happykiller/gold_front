import { mock, MockProxy } from 'jest-mock-extended';

import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { AuthUsecase } from '@usecase/auth/auth.usecase';
import GraphqlService from '@service/graphql/graphql.service';

describe('AuthUsecase', () => {
  const mockInversify: MockProxy<Inversify> = mock<Inversify>();
  const mockGraphqlService: MockProxy<GraphqlService> = mock<GraphqlService>();

  mockInversify.graphqlService = mockGraphqlService;

  const usecase: AuthUsecase = new AuthUsecase(mockInversify);

  describe('#execute', () => {

    it('should build', () => {
      // arrange
      // act
      // assert
      expect(usecase).toBeDefined();
    });

    it('should get response of auth', async () => {
      // arrange
      const data = {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2RlIjoiZmFybyIsImlkIjoxLCJpYXQiOjE3MDc5MjAzOTIsImV4cCI6MTcwNzk0OTE5Mn0.UoayTTvKw7wo38tjnvAC9Omxv_2YMH8U-NGoT0257s4",
        id: 1,
        code: "faro",
        name_first: "Fabrice",
        name_last: "Rosito",
        description: "Admin",
        mail: "fabrice.rosito@gmail.com",
        creation: "1706429496000",
        modification: "1706429496000",
        language: "fr"
      };
      mockGraphqlService.send.mockResolvedValue({
        data: {
          auth: data
        }
      });
      // act
      const response = await usecase.execute({
        login: 'login',
        password: 'password'
      });
      // assert
      expect(response).toEqual({message: CODES.SUCCESS, data});
    });

    it('should get response wrong credential', async () => {
      // arrange
      mockGraphqlService.send.mockResolvedValue({
        errors: [
          {
            message: 'Credentials wrong'
          }
        ]
      });
      // act
      const response = await usecase.execute({
        login: 'login',
        password: 'password'
      });
      // assert
      expect(response).toEqual({
        message: CODES.AUTH_FAIL_WRONG_CREDENTIAL,
        error: 'Credentials wrong'
      });
    });

    it('should manage error', async () => {
      // arrange
      mockGraphqlService.send.mockRejectedValue(new Error('error'));
      // act
      const response = await usecase.execute({
        login: 'login',
        password: 'password'
      });
      // assert
      expect(response).toEqual({message: CODES.AUTH_FAIL_WRONG_CREDENTIAL, error: 'error'});
    });

  });
});