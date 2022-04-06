interface Character {
    id: number;
    name: string;
}

interface Corporation {
    id: number;
    name: string;
}

interface InventoryType {
    id: number;
    name: string;
}

export interface SearchResult {
    characters: Character[];
    corporations: Corporation[];
    inventory_types: InventoryType[];
}
