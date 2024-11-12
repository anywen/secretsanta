var SecretSanta = function () {

    this.names = [];

    this.enforced = Object.create( null );
    this.blacklists = Object.create( null );
};


SecretSanta.prototype.add = function ( name ) {

    if ( this.names.indexOf( name ) !== -1 )
        throw new Error( 'Cannot redefine ' + name );

    this.names.push( name );

    var subapi = { };

    subapi.enforce = function ( other ) {

        this.enforced[ name ] = other;

        return subapi;

    }.bind( this );

    subapi.blacklist = function ( other ) {

        if ( ! Object.prototype.hasOwnProperty.call( this.blacklists, name ) )
            this.blacklists[ name ] = [];

        if ( this.blacklists[ name ].indexOf( other ) === -1 )
            this.blacklists[ name ].push( other );

        return subapi;

    }.bind( this );

    return subapi;

};

SecretSanta.prototype.generate = function () {

    var pairings = Object.create( null );
    var candidatePairings = Object.create( null );
    const santa = new SecretSanta();
    this.names.forEach( function ( name ) {

        if ( Object.prototype.hasOwnProperty.call( this.enforced, name ) ) {

            var enforced = this.enforced[ name ];

            if ( this.names.indexOf( enforced ) === -1 )
                throw new Error( name + ' is paired with ' + enforced + ', which hasn\'t been declared as a possible pairing' );

            Object.keys( pairings ).forEach( function ( name ) {

                if ( pairings[ name ] === enforced ) {
                    throw new Error( 'Per your rules, multiple persons are paired with ' + enforced );
                }

            } );

            candidatePairings[ name ] = [ this.enforced[ name ] ];

        } else {

            var candidates = _.difference( this.names, [ name ] );

            if ( Object.prototype.hasOwnProperty.call( this.blacklists, name ) )
                candidates = _.difference( candidates, this.blacklists[ name ] );

            candidatePairings[ name ] = candidates;

        }

        
    }, this);

    var findNextGifter = function () {

        var names = Object.keys( candidatePairings );

        var minCandidateCount = _.min( names.map( function ( name ) { return candidatePairings[ name ].length; } ) );
        var potentialGifters = names.filter( function ( name ) { return candidatePairings[ name ].length === minCandidateCount; } );

        return _.sample( potentialGifters );

    };

    while (Object.keys(candidatePairings).length > 0) {

        var name = findNextGifter();
    
        if (candidatePairings[name].length === 0) {
            // Récupère le message d’erreur traduit depuis les données de traduction
            const errorMessageTemplate = translations["error_pairing"] || 
                'We haven\'t been able to find a match for ' + name + '! Press "Generate" to try again and, if it still doesn\'t work, try removing some exclusions from your rules. Sorry for the inconvenience!';
    
            // Remplace {name} par le nom de l’utilisateur
            const errorMessage = errorMessageTemplate.replace("{name}", name);
    
            throw new Error(errorMessage);
        }
    
        var pairing = _.sample(candidatePairings[name]);
        delete candidatePairings[name];
    
        Object.keys(candidatePairings).forEach(function (name) {
            candidatePairings[name] = _.without(candidatePairings[name], pairing);
        });
    
        pairings[name] = pairing;
    }
    this.exportResults(pairings);
    return pairings;

};
SecretSanta.prototype.exportResults = function (pairings) {
    let resultText = "Tirage de Noël\n";
    
    for (const [giver, receiver] of Object.entries(pairings)) {
        resultText += `${giver} → ${receiver}\n`;
        
        // Enregistrer l'exclusion pour l'année suivante
        if (!this.blacklists[giver]) {
            this.blacklists[giver] = [];
        }
        if (!this.blacklists[giver].includes(receiver)) {
            this.blacklists[giver].push(receiver);
        }
    }

    // Créez un fichier Blob avec le contenu
    const blob = new Blob([resultText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'santa_results.txt';
    link.click();
};
// Détermine la langue à partir de l'URL ou utilise une langue par défaut
const lang = new URLSearchParams(window.location.search).get("lang") || "en";
// Variable globale pour stocker les traductions
let translations = {};
// Fonction pour charger le fichier de traduction JSON
function loadTranslations(lang) {
    lang = "fr"; // Remplacez par "fr" pour tester en français
    return fetch(`locales/${lang}.json`)
        .then(response => response.json())
        .then(data => {
            translations = data; // Stocke les traductions globalement
            applyTranslations(translations); // Applique les traductions si nécessaire
        })
        .catch(error => console.error("Error loading translations:", error));
}

// Applique les traductions aux éléments de la page
function applyTranslations(translations) {
    document.getElementById("title").innerText = translations["title"];
    document.getElementById("description").innerText = translations["description"];
    document.getElementById("instructions").innerText = translations["instructions"];
    //document.getElementById("error_pairing").innerText = translations["error_pairing"];
    document.getElementById("button_generate").innerText = translations["button_generate"];
}

// Appelle la fonction pour charger les traductions lors du chargement de la page
loadTranslations(lang);