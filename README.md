## Stages

A _stage_ is a specific moment in the game flow. Engine can assume one _stage_
at time. Stage are represented as string and the following list includes all the
available stages:

 * `ready` engine is waiting for the first action in this game session.
 * `done` current game session has finished.

The following examples aims to illustrate the possible game stages.
A stage is assigned to the game always after a player action:
The player call an engine action, engine will assign a value to the stage
and it will return the payload containing the detail for that specific _stage_.

### Minimal

 1. Player calls `restore`
 2. Engine stage: `'ready'`
 3. Player calls `deal`
 4. Engine stage: `player-turn-right`
 5. Player calls `stand`
 6. Engine stage: `done`