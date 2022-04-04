export interface AuthenticatedCharacter {
    CharacterID: number;
    CharacterName: string;
    ExpiresOn: Date;
    Scopes: string;
    TokenType: string;
    CharacterOwnerHash: string;
    ClientID: string;
}

