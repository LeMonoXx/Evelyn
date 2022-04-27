import { Material } from "./material";
import { Product } from "./product";
import { Skill } from "./skill";

export interface Manufacturing {
    materials: Material[];
    products: Product[];
    skills: Skill[];
    time: number;
}