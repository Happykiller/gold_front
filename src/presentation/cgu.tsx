import * as React from 'react';

import '@presentation/cgu.scss';

export const CGU = () => {
  return (
    <div>
      <h2>CGU</h2>
      <div className="scrollable-container">
        <p>
          1. Respect des droits d'auteur :<br/>
          Les utilisateurs doivent respecter les droits d'auteur et ne pas partager de contenu protégé sans autorisation.
        </p>
        <p>
          2. Contenu inapproprié :<br/>
          Les utilisateurs ne doivent pas publier, partager ou transmettre de contenu offensant, diffamatoire, discriminatoire, ou contraire à la loi.
        </p>
        <p>
          3. Protection des données :<br/>
          Le service doit garantir la confidentialité et la sécurité des données des utilisateurs. Aucune information personnelle ne doit être partagée ou vendue à des tiers sans le consentement explicite de l'utilisateur.
        </p>
        <p>
          4. Usage légal :<br/>
          Les utilisateurs doivent utiliser le service conformément aux lois et règlements en vigueur. Tout comportement illégal ne sera pas toléré.
        </p>
        <p>
          5. Respect des autres utilisateurs :<br/>
          Les utilisateurs doivent interagir de manière respectueuse envers les autres utilisateurs et le personnel du service. Le harcèlement, l'intimidation ou toute autre forme de comportement nuisible ne sera pas toléré.
        </p>
        <p>
          6. Limitations d'utilisation :<br/>
          Le service gratuit peut avoir des limitations en termes de fonctionnalités, de stockage ou de bande passante. Les utilisateurs doivent respecter ces limitations et ne pas tenter de contourner les restrictions.
        </p>
        <p>
          7. Modification des conditions d'utilisation :<br/>
          Le fournisseur de services se réserve le droit de modifier les conditions d'utilisation à tout moment. Les utilisateurs seront informés des changements, et il est de leur responsabilité de se tenir informés et de respecter les nouvelles conditions.
        </p>
        <p>
          8. Suspension ou résiliation du compte :<br/>
          Le fournisseur de services se réserve le droit de suspendre ou de résilier le compte d'un utilisateur en cas de non-respect des conditions d'utilisation, d'activités suspectes, ou pour toute autre raison jugée appropriée.
        </p>
        <p>
          9. Support et assistance :<br/>
          Les utilisateurs du service gratuit peuvent bénéficier d'un support limité. Les demandes d'assistance seront traitées dans la mesure du possible, mais la priorité peut être donnée aux utilisateurs payants.
        </p>
        <p>
          10. Réclamation et résolution des conflits :<br/>
          En cas de litige, les utilisateurs doivent contacter le fournisseur de services pour tenter de résoudre le problème de manière amiable avant d'engager des actions légales.
        </p>
      </div>
    </div>
  )
}