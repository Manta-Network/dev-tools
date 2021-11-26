// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { ApiTypes } from '@polkadot/api/types';
import type { Bytes, Null, Option, Result, U8aFixed, Vec, bool, u128, u32, u64, u8 } from '@polkadot/types';
import type { AccountId32, H256 } from '@polkadot/types/interfaces/runtime';
import type { FrameSupportTokensMiscBalanceStatus, FrameSupportWeightsDispatchInfo, PalletDemocracyVoteThreshold, PalletMultisigTimepoint, SpRuntimeDispatchError, XcmV1MultiLocation, XcmV2Response, XcmV2TraitsError, XcmV2TraitsOutcome, XcmV2Xcm, XcmVersionedMultiAssets, XcmVersionedMultiLocation } from '@polkadot/types/lookup';
import type { ITuple } from '@polkadot/types/types';

declare module '@polkadot/api/types/events' {
  export interface AugmentedEvents<ApiType> {
    balances: {
      /**
       * A balance was set by root. \[who, free, reserved\]
       **/
      BalanceSet: AugmentedEvent<ApiType, [AccountId32, u128, u128]>;
      /**
       * Some amount was deposited into the account (e.g. for transaction fees). \[who,
       * deposit\]
       **/
      Deposit: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * An account was removed whose balance was non-zero but below ExistentialDeposit,
       * resulting in an outright loss. \[account, balance\]
       **/
      DustLost: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * An account was created with some free balance. \[account, free_balance\]
       **/
      Endowed: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * Some balance was reserved (moved from free to reserved). \[who, value\]
       **/
      Reserved: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * Some balance was moved from the reserve of the first account to the second account.
       * Final argument indicates the destination balance type.
       * \[from, to, balance, destination_status\]
       **/
      ReserveRepatriated: AugmentedEvent<ApiType, [AccountId32, AccountId32, u128, FrameSupportTokensMiscBalanceStatus]>;
      /**
       * Some amount was removed from the account (e.g. for misbehavior). \[who,
       * amount_slashed\]
       **/
      Slashed: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * Transfer succeeded. \[from, to, value\]
       **/
      Transfer: AugmentedEvent<ApiType, [AccountId32, AccountId32, u128]>;
      /**
       * Some balance was unreserved (moved from reserved to free). \[who, value\]
       **/
      Unreserved: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * Some amount was withdrawn from the account (e.g. for transaction fees). \[who, value\]
       **/
      Withdraw: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    calamariVesting: {
      /**
       * An \[account\] has become fully vested. No further vesting can happen.
       **/
      VestingCompleted: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * Update a vesting schedule.
       * \[new_schedule\]
       **/
      VestingScheduleUpdated: AugmentedEvent<ApiType, [Vec<u64>]>;
      /**
       * The amount vested has been updated. This could indicate more funds are available.
       * The balance given is the amount which is left unvested (and thus locked).
       * \[account, unvested\]
       **/
      VestingUpdated: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    collatorSelection: {
      CandidateAdded: AugmentedEvent<ApiType, [AccountId32, u128]>;
      CandidateRemoved: AugmentedEvent<ApiType, [AccountId32]>;
      NewCandidacyBond: AugmentedEvent<ApiType, [u128]>;
      NewDesiredCandidates: AugmentedEvent<ApiType, [u32]>;
      NewInvulnerables: AugmentedEvent<ApiType, [Vec<AccountId32>]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    council: {
      /**
       * A motion was approved by the required threshold.
       * \[proposal_hash\]
       **/
      Approved: AugmentedEvent<ApiType, [H256]>;
      /**
       * A proposal was closed because its threshold was reached or after its duration was up.
       * \[proposal_hash, yes, no\]
       **/
      Closed: AugmentedEvent<ApiType, [H256, u32, u32]>;
      /**
       * A motion was not approved by the required threshold.
       * \[proposal_hash\]
       **/
      Disapproved: AugmentedEvent<ApiType, [H256]>;
      /**
       * A motion was executed; result will be `Ok` if it returned without error.
       * \[proposal_hash, result\]
       **/
      Executed: AugmentedEvent<ApiType, [H256, Result<Null, SpRuntimeDispatchError>]>;
      /**
       * A single member did some action; result will be `Ok` if it returned without error.
       * \[proposal_hash, result\]
       **/
      MemberExecuted: AugmentedEvent<ApiType, [H256, Result<Null, SpRuntimeDispatchError>]>;
      /**
       * A motion (given hash) has been proposed (by given account) with a threshold (given
       * `MemberCount`).
       * \[account, proposal_index, proposal_hash, threshold\]
       **/
      Proposed: AugmentedEvent<ApiType, [AccountId32, u32, H256, u32]>;
      /**
       * A motion (given hash) has been voted on by given account, leaving
       * a tally (yes votes and no votes given respectively as `MemberCount`).
       * \[account, proposal_hash, voted, yes, no\]
       **/
      Voted: AugmentedEvent<ApiType, [AccountId32, H256, bool, u32, u32]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    councilMembership: {
      /**
       * Phantom member, never used.
       **/
      Dummy: AugmentedEvent<ApiType, []>;
      /**
       * One of the members' keys changed.
       **/
      KeyChanged: AugmentedEvent<ApiType, []>;
      /**
       * The given member was added; see the transaction for who.
       **/
      MemberAdded: AugmentedEvent<ApiType, []>;
      /**
       * The given member was removed; see the transaction for who.
       **/
      MemberRemoved: AugmentedEvent<ApiType, []>;
      /**
       * The membership was reset; see the transaction for who the new set is.
       **/
      MembersReset: AugmentedEvent<ApiType, []>;
      /**
       * Two members were swapped; see the transaction for who.
       **/
      MembersSwapped: AugmentedEvent<ApiType, []>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    cumulusXcm: {
      /**
       * Downward message executed with the given outcome.
       * \[ id, outcome \]
       **/
      ExecutedDownward: AugmentedEvent<ApiType, [U8aFixed, XcmV2TraitsOutcome]>;
      /**
       * Downward message is invalid XCM.
       * \[ id \]
       **/
      InvalidFormat: AugmentedEvent<ApiType, [U8aFixed]>;
      /**
       * Downward message is unsupported version of XCM.
       * \[ id \]
       **/
      UnsupportedVersion: AugmentedEvent<ApiType, [U8aFixed]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    democracy: {
      /**
       * A proposal \[hash\] has been blacklisted permanently.
       **/
      Blacklisted: AugmentedEvent<ApiType, [H256]>;
      /**
       * A referendum has been cancelled. \[ref_index\]
       **/
      Cancelled: AugmentedEvent<ApiType, [u32]>;
      /**
       * An account has delegated their vote to another account. \[who, target\]
       **/
      Delegated: AugmentedEvent<ApiType, [AccountId32, AccountId32]>;
      /**
       * A proposal has been enacted. \[ref_index, result\]
       **/
      Executed: AugmentedEvent<ApiType, [u32, Result<Null, SpRuntimeDispatchError>]>;
      /**
       * An external proposal has been tabled.
       **/
      ExternalTabled: AugmentedEvent<ApiType, []>;
      /**
       * A proposal has been rejected by referendum. \[ref_index\]
       **/
      NotPassed: AugmentedEvent<ApiType, [u32]>;
      /**
       * A proposal has been approved by referendum. \[ref_index\]
       **/
      Passed: AugmentedEvent<ApiType, [u32]>;
      /**
       * A proposal could not be executed because its preimage was invalid.
       * \[proposal_hash, ref_index\]
       **/
      PreimageInvalid: AugmentedEvent<ApiType, [H256, u32]>;
      /**
       * A proposal could not be executed because its preimage was missing.
       * \[proposal_hash, ref_index\]
       **/
      PreimageMissing: AugmentedEvent<ApiType, [H256, u32]>;
      /**
       * A proposal's preimage was noted, and the deposit taken. \[proposal_hash, who, deposit\]
       **/
      PreimageNoted: AugmentedEvent<ApiType, [H256, AccountId32, u128]>;
      /**
       * A registered preimage was removed and the deposit collected by the reaper.
       * \[proposal_hash, provider, deposit, reaper\]
       **/
      PreimageReaped: AugmentedEvent<ApiType, [H256, AccountId32, u128, AccountId32]>;
      /**
       * A proposal preimage was removed and used (the deposit was returned).
       * \[proposal_hash, provider, deposit\]
       **/
      PreimageUsed: AugmentedEvent<ApiType, [H256, AccountId32, u128]>;
      /**
       * A motion has been proposed by a public account. \[proposal_index, deposit\]
       **/
      Proposed: AugmentedEvent<ApiType, [u32, u128]>;
      /**
       * A referendum has begun. \[ref_index, threshold\]
       **/
      Started: AugmentedEvent<ApiType, [u32, PalletDemocracyVoteThreshold]>;
      /**
       * A public proposal has been tabled for referendum vote. \[proposal_index, deposit,
       * depositors\]
       **/
      Tabled: AugmentedEvent<ApiType, [u32, u128, Vec<AccountId32>]>;
      /**
       * An \[account\] has cancelled a previous delegation operation.
       **/
      Undelegated: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * An external proposal has been vetoed. \[who, proposal_hash, until\]
       **/
      Vetoed: AugmentedEvent<ApiType, [AccountId32, H256, u32]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    dmpQueue: {
      /**
       * Downward message executed with the given outcome.
       * \[ id, outcome \]
       **/
      ExecutedDownward: AugmentedEvent<ApiType, [U8aFixed, XcmV2TraitsOutcome]>;
      /**
       * Downward message is invalid XCM.
       * \[ id \]
       **/
      InvalidFormat: AugmentedEvent<ApiType, [U8aFixed]>;
      /**
       * Downward message is overweight and was placed in the overweight queue.
       * \[ id, index, required \]
       **/
      OverweightEnqueued: AugmentedEvent<ApiType, [U8aFixed, u64, u64]>;
      /**
       * Downward message from the overweight queue was executed.
       * \[ index, used \]
       **/
      OverweightServiced: AugmentedEvent<ApiType, [u64, u64]>;
      /**
       * Downward message is unsupported version of XCM.
       * \[ id \]
       **/
      UnsupportedVersion: AugmentedEvent<ApiType, [U8aFixed]>;
      /**
       * The weight limit for handling downward messages was reached.
       * \[ id, remaining, required \]
       **/
      WeightExhausted: AugmentedEvent<ApiType, [U8aFixed, u64, u64]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    multisig: {
      /**
       * A multisig operation has been approved by someone.
       * \[approving, timepoint, multisig, call_hash\]
       **/
      MultisigApproval: AugmentedEvent<ApiType, [AccountId32, PalletMultisigTimepoint, AccountId32, U8aFixed]>;
      /**
       * A multisig operation has been cancelled. \[cancelling, timepoint, multisig, call_hash\]
       **/
      MultisigCancelled: AugmentedEvent<ApiType, [AccountId32, PalletMultisigTimepoint, AccountId32, U8aFixed]>;
      /**
       * A multisig operation has been executed. \[approving, timepoint, multisig, call_hash\]
       **/
      MultisigExecuted: AugmentedEvent<ApiType, [AccountId32, PalletMultisigTimepoint, AccountId32, U8aFixed, Result<Null, SpRuntimeDispatchError>]>;
      /**
       * A new multisig operation has begun. \[approving, multisig, call_hash\]
       **/
      NewMultisig: AugmentedEvent<ApiType, [AccountId32, AccountId32, U8aFixed]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    parachainSystem: {
      /**
       * Downward messages were processed using the given weight.
       * \[ weight_used, result_mqc_head \]
       **/
      DownwardMessagesProcessed: AugmentedEvent<ApiType, [u64, H256]>;
      /**
       * Some downward messages have been received and will be processed.
       * \[ count \]
       **/
      DownwardMessagesReceived: AugmentedEvent<ApiType, [u32]>;
      /**
       * An upgrade has been authorized.
       **/
      UpgradeAuthorized: AugmentedEvent<ApiType, [H256]>;
      /**
       * The validation function was applied as of the contained relay chain block number.
       **/
      ValidationFunctionApplied: AugmentedEvent<ApiType, [u32]>;
      /**
       * The relay-chain aborted the upgrade process.
       **/
      ValidationFunctionDiscarded: AugmentedEvent<ApiType, []>;
      /**
       * The validation function has been scheduled to apply.
       **/
      ValidationFunctionStored: AugmentedEvent<ApiType, []>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    polkadotXcm: {
      /**
       * Some assets have been placed in an asset trap.
       * 
       * \[ hash, origin, assets \]
       **/
      AssetsTrapped: AugmentedEvent<ApiType, [H256, XcmV1MultiLocation, XcmVersionedMultiAssets]>;
      /**
       * Execution of an XCM message was attempted.
       * 
       * \[ outcome \]
       **/
      Attempted: AugmentedEvent<ApiType, [XcmV2TraitsOutcome]>;
      /**
       * Expected query response has been received but the origin location of the response does
       * not match that expected. The query remains registered for a later, valid, response to
       * be received and acted upon.
       * 
       * \[ origin location, id, expected location \]
       **/
      InvalidResponder: AugmentedEvent<ApiType, [XcmV1MultiLocation, u64, Option<XcmV1MultiLocation>]>;
      /**
       * Expected query response has been received but the expected origin location placed in
       * storate by this runtime previously cannot be decoded. The query remains registered.
       * 
       * This is unexpected (since a location placed in storage in a previously executing
       * runtime should be readable prior to query timeout) and dangerous since the possibly
       * valid response will be dropped. Manual governance intervention is probably going to be
       * needed.
       * 
       * \[ origin location, id \]
       **/
      InvalidResponderVersion: AugmentedEvent<ApiType, [XcmV1MultiLocation, u64]>;
      /**
       * Query response has been received and query is removed. The registered notification has
       * been dispatched and executed successfully.
       * 
       * \[ id, pallet index, call index \]
       **/
      Notified: AugmentedEvent<ApiType, [u64, u8, u8]>;
      /**
       * Query response has been received and query is removed. The dispatch was unable to be
       * decoded into a `Call`; this might be due to dispatch function having a signature which
       * is not `(origin, QueryId, Response)`.
       * 
       * \[ id, pallet index, call index \]
       **/
      NotifyDecodeFailed: AugmentedEvent<ApiType, [u64, u8, u8]>;
      /**
       * Query response has been received and query is removed. There was a general error with
       * dispatching the notification call.
       * 
       * \[ id, pallet index, call index \]
       **/
      NotifyDispatchError: AugmentedEvent<ApiType, [u64, u8, u8]>;
      /**
       * Query response has been received and query is removed. The registered notification could
       * not be dispatched because the dispatch weight is greater than the maximum weight
       * originally budgeted by this runtime for the query result.
       * 
       * \[ id, pallet index, call index, actual weight, max budgeted weight \]
       **/
      NotifyOverweight: AugmentedEvent<ApiType, [u64, u8, u8, u64, u64]>;
      /**
       * A given location which had a version change subscription was dropped owing to an error
       * migrating the location to our new XCM format.
       * 
       * \[ location, query ID \]
       **/
      NotifyTargetMigrationFail: AugmentedEvent<ApiType, [XcmVersionedMultiLocation, u64]>;
      /**
       * A given location which had a version change subscription was dropped owing to an error
       * sending the notification to it.
       * 
       * \[ location, query ID, error \]
       **/
      NotifyTargetSendFail: AugmentedEvent<ApiType, [XcmV1MultiLocation, u64, XcmV2TraitsError]>;
      /**
       * Query response has been received and is ready for taking with `take_response`. There is
       * no registered notification call.
       * 
       * \[ id, response \]
       **/
      ResponseReady: AugmentedEvent<ApiType, [u64, XcmV2Response]>;
      /**
       * Received query response has been read and removed.
       * 
       * \[ id \]
       **/
      ResponseTaken: AugmentedEvent<ApiType, [u64]>;
      /**
       * A XCM message was sent.
       * 
       * \[ origin, destination, message \]
       **/
      Sent: AugmentedEvent<ApiType, [XcmV1MultiLocation, XcmV1MultiLocation, XcmV2Xcm]>;
      /**
       * The supported version of a location has been changed. This might be through an
       * automatic notification or a manual intervention.
       * 
       * \[ location, XCM version \]
       **/
      SupportedVersionChanged: AugmentedEvent<ApiType, [XcmV1MultiLocation, u32]>;
      /**
       * Query response received which does not match a registered query. This may be because a
       * matching query was never registered, it may be because it is a duplicate response, or
       * because the query timed out.
       * 
       * \[ origin location, id \]
       **/
      UnexpectedResponse: AugmentedEvent<ApiType, [XcmV1MultiLocation, u64]>;
      /**
       * An XCM version change notification message has been attempted to be sent.
       * 
       * \[ destination, result \]
       **/
      VersionChangeNotified: AugmentedEvent<ApiType, [XcmV1MultiLocation, u32]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    scheduler: {
      /**
       * Canceled some task. \[when, index\]
       **/
      Canceled: AugmentedEvent<ApiType, [u32, u32]>;
      /**
       * Dispatched some task. \[task, id, result\]
       **/
      Dispatched: AugmentedEvent<ApiType, [ITuple<[u32, u32]>, Option<Bytes>, Result<Null, SpRuntimeDispatchError>]>;
      /**
       * Scheduled some task. \[when, index\]
       **/
      Scheduled: AugmentedEvent<ApiType, [u32, u32]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    session: {
      /**
       * New session has happened. Note that the argument is the \[session_index\], not the
       * block number as the type might suggest.
       **/
      NewSession: AugmentedEvent<ApiType, [u32]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    sudo: {
      /**
       * The \[sudoer\] just switched identity; the old key is supplied.
       **/
      KeyChanged: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * A sudo just took place. \[result\]
       **/
      Sudid: AugmentedEvent<ApiType, [Result<Null, SpRuntimeDispatchError>]>;
      /**
       * A sudo just took place. \[result\]
       **/
      SudoAsDone: AugmentedEvent<ApiType, [Result<Null, SpRuntimeDispatchError>]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    system: {
      /**
       * `:code` was updated.
       **/
      CodeUpdated: AugmentedEvent<ApiType, []>;
      /**
       * An extrinsic failed. \[error, info\]
       **/
      ExtrinsicFailed: AugmentedEvent<ApiType, [SpRuntimeDispatchError, FrameSupportWeightsDispatchInfo]>;
      /**
       * An extrinsic completed successfully. \[info\]
       **/
      ExtrinsicSuccess: AugmentedEvent<ApiType, [FrameSupportWeightsDispatchInfo]>;
      /**
       * An \[account\] was reaped.
       **/
      KilledAccount: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * A new \[account\] was created.
       **/
      NewAccount: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * On on-chain remark happened. \[origin, remark_hash\]
       **/
      Remarked: AugmentedEvent<ApiType, [AccountId32, H256]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    technicalCommittee: {
      /**
       * A motion was approved by the required threshold.
       * \[proposal_hash\]
       **/
      Approved: AugmentedEvent<ApiType, [H256]>;
      /**
       * A proposal was closed because its threshold was reached or after its duration was up.
       * \[proposal_hash, yes, no\]
       **/
      Closed: AugmentedEvent<ApiType, [H256, u32, u32]>;
      /**
       * A motion was not approved by the required threshold.
       * \[proposal_hash\]
       **/
      Disapproved: AugmentedEvent<ApiType, [H256]>;
      /**
       * A motion was executed; result will be `Ok` if it returned without error.
       * \[proposal_hash, result\]
       **/
      Executed: AugmentedEvent<ApiType, [H256, Result<Null, SpRuntimeDispatchError>]>;
      /**
       * A single member did some action; result will be `Ok` if it returned without error.
       * \[proposal_hash, result\]
       **/
      MemberExecuted: AugmentedEvent<ApiType, [H256, Result<Null, SpRuntimeDispatchError>]>;
      /**
       * A motion (given hash) has been proposed (by given account) with a threshold (given
       * `MemberCount`).
       * \[account, proposal_index, proposal_hash, threshold\]
       **/
      Proposed: AugmentedEvent<ApiType, [AccountId32, u32, H256, u32]>;
      /**
       * A motion (given hash) has been voted on by given account, leaving
       * a tally (yes votes and no votes given respectively as `MemberCount`).
       * \[account, proposal_hash, voted, yes, no\]
       **/
      Voted: AugmentedEvent<ApiType, [AccountId32, H256, bool, u32, u32]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    technicalMembership: {
      /**
       * Phantom member, never used.
       **/
      Dummy: AugmentedEvent<ApiType, []>;
      /**
       * One of the members' keys changed.
       **/
      KeyChanged: AugmentedEvent<ApiType, []>;
      /**
       * The given member was added; see the transaction for who.
       **/
      MemberAdded: AugmentedEvent<ApiType, []>;
      /**
       * The given member was removed; see the transaction for who.
       **/
      MemberRemoved: AugmentedEvent<ApiType, []>;
      /**
       * The membership was reset; see the transaction for who the new set is.
       **/
      MembersReset: AugmentedEvent<ApiType, []>;
      /**
       * Two members were swapped; see the transaction for who.
       **/
      MembersSwapped: AugmentedEvent<ApiType, []>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    transactionPause: {
      /**
       * Paused transaction . \[pallet_name_bytes, function_name_bytes\]
       **/
      TransactionPaused: AugmentedEvent<ApiType, [Bytes, Bytes]>;
      /**
       * Unpaused transaction . \[pallet_name_bytes, function_name_bytes\]
       **/
      TransactionUnpaused: AugmentedEvent<ApiType, [Bytes, Bytes]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    utility: {
      /**
       * Batch of dispatches completed fully with no error.
       **/
      BatchCompleted: AugmentedEvent<ApiType, []>;
      /**
       * Batch of dispatches did not complete fully. Index of first failing dispatch given, as
       * well as the error. \[index, error\]
       **/
      BatchInterrupted: AugmentedEvent<ApiType, [u32, SpRuntimeDispatchError]>;
      /**
       * A single item within a Batch of dispatches has completed with no error.
       **/
      ItemCompleted: AugmentedEvent<ApiType, []>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    xcmpQueue: {
      /**
       * Bad XCM format used.
       **/
      BadFormat: AugmentedEvent<ApiType, [Option<H256>]>;
      /**
       * Bad XCM version used.
       **/
      BadVersion: AugmentedEvent<ApiType, [Option<H256>]>;
      /**
       * Some XCM failed.
       **/
      Fail: AugmentedEvent<ApiType, [Option<H256>, XcmV2TraitsError]>;
      /**
       * Some XCM was executed ok.
       **/
      Success: AugmentedEvent<ApiType, [Option<H256>]>;
      /**
       * An upward message was sent to the relay chain.
       **/
      UpwardMessageSent: AugmentedEvent<ApiType, [Option<H256>]>;
      /**
       * An HRMP message was sent to a sibling parachain.
       **/
      XcmpMessageSent: AugmentedEvent<ApiType, [Option<H256>]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
  }

  export interface DecoratedEvents<ApiType extends ApiTypes> extends AugmentedEvents<ApiType> {
    [key: string]: ModuleEvents<ApiType>;
  }
}
