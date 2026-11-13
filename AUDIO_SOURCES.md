# Gorilla · Soundtrack and approved SFX

Sources selected by the game's creator. The Pages workflow downloads and prepares audio into `public/audio` during deployment. **Only downloaded assets play**; missing assets remain silent rather than being replaced by artificial effects. The deployment includes `audio/status.json` with available and unavailable clips.

| Event | Approved recording | Source | Edit |
| --- | --- | --- | --- |
| Battle start | Crowd Yells Charge | https://freesound.org/people/ShangusBurger/sounds/764267/ | first 4 seconds |
| Human punches | Punch, danlucaz | https://freesound.org/people/danlucaz/sounds/517744/ | original, on successful hand hits only |
| Gorilla punches | Same Punch | same source | playback at 0.8× to lower pitch and increase perceived weight |
| Gorilla running | Running on dirt road, spinopel | https://pixabay.com/sound-effects/film-special-effects-running-on-dirt-road-345729/ | 1.5×, while running only |
| Gorilla normal roar | Gorilla Roar, J0ck0 | https://freesound.org/people/J0ck0/sounds/397054/ | original |
| Gorilla squeeze | Lettuce Crushing Gore | https://pixabay.com/sound-effects/film-special-effects-lettuce-crushing-gore-sound-27156/ | first 3 seconds; start with grab |
| Throwing human | Fast Swoosh | https://pixabay.com/sound-effects/film-special-effects-fast-swoosh-383967/ | 0.65× |
| Firearms | 22 Magnum Pistol Shot | https://freesound.org/people/michorvath/sounds/427594/ | humans firing only |
| Throwing object | Swing Whoosh 5 | https://pixabay.com/sound-effects/film-special-effects-swing-whoosh-5-198498/ | original |
| Object hit | Impact Thud | https://pixabay.com/sound-effects/film-special-effects-impact-thud-291047/ | original |
| Human falls | Body Fall 5, CosmicEmbers | https://freesound.org/people/CosmicEmbers/sounds/160742/ | original |
| Gorilla second life | Gorilla Roar, flutie8211 | https://pixabay.com/sound-effects/film-special-effects-gorilla-roar-523007/ | 2s–5s |
| Deploying ropes | Rope Tighten Knot 5 | https://pixabay.com/es/sound-effects/pel%C3%ADculas-y-efectos-especiales-rope-tighten-knot-5-199791/ | original |
| Breaking ropes | Romper cuerda, checholio | https://freesound.org/people/checholio/sounds/443833/ | repeated progressively over animation |
| Picking up supplies | Picking Up a Small Item, qubodup | https://freesound.org/people/qubodup/sounds/822565/ | original |
| Dropping item | Dropping Bag of Bread, qubodup | https://freesound.org/people/qubodup/sounds/189312/ | first 1 second |

## Soundtrack

- **Claro del bosque; Hangar**: Juhani Junkala / SubspaceAudio, Epic Boss Battle (CC0): https://opengameart.org/content/boss-battle-music
- **Selva y ruinas**: Cleyton Kauffman, Boss Battle Theme, first MP3 version (CC0): https://opengameart.org/content/boss-battle-theme
- **Cañón rocoso**: Cleyton Kauffman, Boss Battle Theme variation OGG (CC0): https://opengameart.org/content/boss-battle-theme

Soundtrack files are converted to MP3, looped during battle, dimmed at second-life announcement, and stopped after battle. Music and effects have separate volume sliders under Settings.

## Credits and licenses

- Freesound recordings above are CC0 except **Body Fall 5** by **CosmicEmbers**, which is **CC BY 3.0**: https://creativecommons.org/licenses/by/3.0/ — credit: `Body Fall 5 by CosmicEmbers (Freesound), licensed CC BY 3.0; edits: audio encoding`.
- OpenGameArt tracks above are CC0.
- Pixabay recordings are used under the Pixabay Content License; their specific authors are credited at the linked source pages. Do not substitute similarly named recordings: file identities must match the approved source page.
- User should verify the deployed `audio/status.json`; Pixabay may return HTTP 403 to CI servers even for freely usable content. For those recordings, locally acquired original files must be provided to the repository's audio pipeline instead.
