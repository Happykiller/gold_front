import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * Types GraphQL générés depuis le schéma du serveur.
 *
 * Le front n'a pas de client GraphQL : chaque usecase écrit sa requête à la
 * main et reçoit du `any`. Rien ne reliait donc le front au serveur, et un
 * champ renommé côté API ne se voyait qu'à l'exécution, sur un écran.
 *
 * Le codegen ne change pas cette architecture — il en comble le trou : les
 * opérations sont extraites des template strings et confrontées au schéma,
 * puis leurs types alimentent les usecases à la place des `any`.
 *
 * Les template strings sont repérées grâce au commentaire `/* GraphQL *\/`
 * qui les précède : aucune dépendance supplémentaire à l'exécution, et les
 * éditeurs colorisent la requête au passage.
 *
 * `docs/gqlschema.gql` est une copie de celui de gold_server, qui fait foi
 * (il y est généré par `autoSchemaFile`). Le job `codegen:check` de la CI
 * échoue si le fichier généré n'est plus à jour.
 */
const config: CodegenConfig = {
  schema: 'docs/gqlschema.gql',
  documents: ['src/**/*.ts', '!src/**/*.test.ts', '!src/gql/**'],
  ignoreNoDocuments: false,
  generates: {
    'src/gql/graphql.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: {
        // Le serveur renvoie ses identifiants en Int et ses montants en Float :
        // pas de scalaire exotique à mapper.
        skipTypename: true,
        avoidOptionals: false,
        enumsAsTypes: true,
      },
    },
  },
  hooks: {
    afterAllFileWrite: ['prettier --write'],
  },
};

export default config;
