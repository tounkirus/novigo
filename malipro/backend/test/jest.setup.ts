// Charge le polyfill de métadonnées avant TOUTE spec, afin que les décorateurs
// class-validator / class-transformer disposent de Reflect.getMetadata même
// lorsqu'une spec importe un DTO sans passer par le harness de test Nest.
import "reflect-metadata";
