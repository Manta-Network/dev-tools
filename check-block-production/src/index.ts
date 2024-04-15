import { ApiPromise, WsProvider } from "@polkadot/api";
import "@polkadot/api-augment";

const BLOCKS_PER_ROUND = 1800; // each round has 1800 blocks
const POINTS_PER_BLOCK = 20; // producing 1 block will get 20 points

async function createPromiseApi(nodeAddress: string) {
  const wsProvider = new WsProvider(nodeAddress);

  const api = new ApiPromise({
    provider: wsProvider,
  });
  await api.isReady;
  console.log(`${nodeAddress} has been started`);
  return api;
}

const getCollatorsAreActive = async (api, collatorAddresses) => {
  const activeCollators = (
    await api.query.parachainStaking.selectedCandidates()
  ).map((collator) => collator.toString());
  return activeCollators;
};

const getBlocksCurrentRound = async (api, round, collatorAddresses) => {
  if (round.current === 0) {
    return 0;
  }
  const args = collatorAddresses.map((address) => [round.current, address]);
  const pointsPreviousRoundRaw =
    await api.query.parachainStaking.awardedPts.multi(args);
  // producing 1 block will get 20 points
  // how many blocks this collator produces in last round
  return pointsPreviousRoundRaw.map(
    (pointsRaw) => pointsRaw.toNumber() / POINTS_PER_BLOCK
  );
};

const getBlocksPreviousRound = async (api, round, collatorAddresses) => {
  if (round.current === 0) {
    return 0;
  }
  const args = collatorAddresses.map((address) => [round.current - 1, address]);
  const pointsPreviousRoundRaw =
    await api.query.parachainStaking.awardedPts.multi(args);
  // producing 1 block will get 20 points
  // how many blocks this collator produces in last round
  return pointsPreviousRoundRaw.map(
    (pointsRaw) => pointsRaw.toNumber() / POINTS_PER_BLOCK
  );
};

const getBlockProductionStalledCollators = async (api) => {
  // round info
  const round = await api.query.parachainStaking.round();

  // get all current collators
  const allCollators = (await api.query.parachainStaking.candidatePool()).map(
    (candidate) => candidate.owner.toString()
  );

  // filter collators who don't join in last round
  const activeCollators = await getCollatorsAreActive(api, allCollators);

  const idealBlocksProducedForEachCollator = Math.round(
    BLOCKS_PER_ROUND / activeCollators.length
  );

  // check current round
  console.log(`Checking block production for current round.`);
  const currentRoundBlocksProduced = await getBlocksCurrentRound(
    api,
    round,
    activeCollators
  );
  console.log(`Checking block production for current round.`);
  for (let i = 0; i < activeCollators.length; i++) {
    if (currentRoundBlocksProduced[i] === 0) {
      console.log(`Collator ${activeCollators[i]} is not producing blocks!`);
    }
  }

  // check last round
  const prevRoundBlocksProduced = await getBlocksPreviousRound(
    api,
    round,
    activeCollators
  );
  console.log(`Checking block production for last round.`);
  for (let i = 0; i < activeCollators.length; i++) {
    // if block counts is down by 4, we think the collator hasn't a good condition at block production.
    if (idealBlocksProducedForEachCollator - prevRoundBlocksProduced[i] >= 5) {
      console.log(
        `Collator ${activeCollators[i]} (produced ${prevRoundBlocksProduced[i]} blocks) had poor performance at block production in last round!`
      );
    }
  }
};

async function main() {
  const mantaEndpoint = "wss://ws.manta.systems/";
  const api = await createPromiseApi(mantaEndpoint);

  await getBlockProductionStalledCollators(api);

  await api.disconnect();
}

main().catch(console.error);
