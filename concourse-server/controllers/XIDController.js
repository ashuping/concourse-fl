import 'fs'
import 'path'
import adjectives_phys from '../resources/adjectives.js'
import adjectives_pers from '../resources/adjectives_2.js'
import monsters from '../resources/monsters.js'

String.prototype.conc_toTitleCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

export function gen_IEX(){
    const adj1 = adjectives_pers.words[Math.floor(Math.random() * adjectives_pers.words.length)]
    const adj2 = adjectives_phys.words[Math.floor(Math.random() * adjectives_phys.words.length)]
    const mon  = monsters.words  [Math.floor(Math.random() * monsters.words.length)]

    return adj1.conc_toTitleCase() + " " + adj2.conc_toTitleCase() + " " + mon
}