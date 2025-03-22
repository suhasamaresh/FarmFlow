"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as rawIdl from "../../idl.json";
import type { DecentralizedAgSupply } from "../../types/decentralized_ag_supply";
import Link from "next/link";
import { ChevronLeft, FileText, Vote, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { AnchorProvider, BN, Program, setProvider } from "@coral-xyz/anchor";
import { toast } from "react-hot-toast";

const programId = new PublicKey(rawIdl.address);

type Proposal = {
  proposalId: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  executed: boolean;
  createdAt: string;
  voterCount: number; // Number of unique voters
};

const GovernancePage = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [proposalIdCreate, setProposalIdCreate] = useState("");
  const [description, setDescription] = useState("");
  const [proposalIdVote, setProposalIdVote] = useState("");
  const [voteFor, setVoteFor] = useState<boolean | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [createResult, setCreateResult] = useState<{ proposalId: string; timestamp: string } | null>(null);
  const [voteResult, setVoteResult] = useState<{ proposalId: string; vote: string; timestamp: string } | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isFetchingProposals, setIsFetchingProposals] = useState(false);

  useEffect(() => {
    if (anchorWallet) {
      fetchAllProposals();
    }
  }, [anchorWallet]);

  const fetchAllProposals = async () => {
    if (!anchorWallet) return;
    setIsFetchingProposals(true);
    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      setProvider(provider);
      const program = new Program(rawIdl as unknown as DecentralizedAgSupply, provider);

      const proposalAccounts = await (program.account as any).governanceProposal.all();
      const fetchedProposals = proposalAccounts.map((account: { account: { proposalId: { toString: () => any; }; description: any; votesFor: { toNumber: () => any; }; votesAgainst: { toNumber: () => any; }; executed: any; createdAt: { toNumber: () => number; }; voters: string | any[]; }; }) => ({
        proposalId: `PROP-${account.account.proposalId.toString()}`,
        description: account.account.description,
        votesFor: account.account.votesFor.toNumber(),
        votesAgainst: account.account.votesAgainst.toNumber(),
        executed: account.account.executed,
        createdAt: new Date(account.account.createdAt.toNumber() * 1000).toLocaleString(),
        voterCount: account.account.voters.length, // Number of unique voters
      }));
      setProposals(fetchedProposals);
    } catch (err) {
      console.error("Error fetching proposals:", err);
      toast.error("Failed to fetch proposals.");
    } finally {
      setIsFetchingProposals(false);
    }
  };

  const generateUniqueProposalId = async () => {
    if (!anchorWallet) {
      toast.error("Please connect your wallet");
      return;
    }
    setIsGenerating(true);
    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      setProvider(provider);
      const program = new Program(rawIdl as unknown as DecentralizedAgSupply, provider);

      let id = Math.floor(Math.random() * 1000000);
      let exists = true;

      while (exists) {
        const proposalIdBN = new BN(id);
        const [proposalPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("proposal"), proposalIdBN.toArrayLike(Buffer, "le", 8)],
          programId
        );
        const accountInfo = await connection.getAccountInfo(proposalPDA);
        if (!accountInfo) {
          exists = false;
        } else {
          id += 1;
        }
      }

      setProposalIdCreate(`PROP-${id}`);
      toast.success(`Generated unique Proposal ID: PROP-${id}`);
    } catch (err) {
      console.error("Error generating proposal ID:", err);
      toast.error("Failed to generate unique ID.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anchorWallet) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!proposalIdCreate || !description) {
      toast.error("Please enter both Proposal ID and Description");
      return;
    }
    if (description.length > 128) {
      toast.error("Description must be 128 characters or less");
      return;
    }
    const proposalIdNum = parseInt(proposalIdCreate.replace("PROP-", ""));
    if (isNaN(proposalIdNum)) {
      toast.error("Invalid Proposal ID format. Use e.g., PROP-123");
      return;
    }

    setIsCreating(true);
    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      setProvider(provider);
      const program = new Program(rawIdl as unknown as DecentralizedAgSupply, provider);

      const proposalIdBN = new BN(proposalIdNum);
      const [proposalPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), proposalIdBN.toArrayLike(Buffer, "le", 8)],
        programId
      );

      await program.methods
        .createProposal(proposalIdBN, description)
        .accounts({
          proposal: proposalPDA,
          proposer: anchorWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const timestamp = new Date().toLocaleString();
      setCreateResult({ proposalId: `PROP-${proposalIdNum}`, timestamp });
      fetchAllProposals();
      toast.success("Proposal created successfully!");
    } catch (err) {
      console.error("Error creating proposal:", err);
      toast.error("Failed to create proposal. Check the ID and try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleVoteProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anchorWallet) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!proposalIdVote || voteFor === null) {
      toast.error("Please enter Proposal ID and select a vote");
      return;
    }
    const proposalIdNum = parseInt(proposalIdVote.replace("PROP-", ""));
    if (isNaN(proposalIdNum)) {
      toast.error("Invalid Proposal ID format. Use e.g., PROP-123");
      return;
    }

    setIsVoting(true);
    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      setProvider(provider);
      const program = new Program(rawIdl as unknown as DecentralizedAgSupply, provider);

      const proposalIdBN = new BN(proposalIdNum);
      const [proposalPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), proposalIdBN.toArrayLike(Buffer, "le", 8)],
        programId
      );

      await program.methods
        .voteProposal(proposalIdBN, voteFor)
        .accounts({
          proposal: proposalPDA,
          voter: anchorWallet.publicKey,
        })
        .rpc();

      const timestamp = new Date().toLocaleString();
      setVoteResult({ proposalId: `PROP-${proposalIdNum}`, vote: voteFor ? "For" : "Against", timestamp });
      fetchAllProposals();
      toast.success(`Voted ${voteFor ? "For" : "Against"} successfully!`);
    } catch (err) {
      console.error("Error voting on proposal:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes("AlreadyVoted")) {
        toast.error("You have already voted on this proposal.");
      } else {
        toast.error("Failed to vote. Ensure the proposal exists and try again.");
      }
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <section className="bg-gradient-to-r from-green-50 to-blue-50 min-h-screen py-20 px-4">
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Link href="/" className="text-gray-600 hover:text-green-600 mb-6 flex items-center font-medium">
          <ChevronLeft className="mr-2" /> Back to Home
        </Link>

        <div className="flex flex-col lg:flex-row items-start gap-12">
          {/* Left Side: Create and Vote */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Create Proposal */}
            <motion.div
              className="bg-white rounded-xl shadow-xl p-8 border border-gray-100 mb-8"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.h1
                className="text-3xl font-bold text-gray-800 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <span className="text-green-600">Create</span> a Proposal
              </motion.h1>
              <motion.p
                className="text-lg text-gray-600 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                Submit a new governance proposal for community voting.
              </motion.p>

              <form onSubmit={handleCreateProposal} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <label htmlFor="proposalIdCreate" className="block text-sm font-medium text-gray-700">
                    Proposal ID
                  </label>
                  <div className="flex items-center mt-1 space-x-2">
                    <input
                      id="proposalIdCreate"
                      type="text"
                      value={proposalIdCreate}
                      onChange={(e) => setProposalIdCreate(e.target.value)}
                      className="flex-1 bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                      required
                      disabled={isCreating || isGenerating}
                      placeholder="e.g., PROP-123"
                    />
                    <motion.button
                      type="button"
                      onClick={generateUniqueProposalId}
                      className={`whitespace-nowrap px-4 py-3 rounded-lg text-sm font-medium ${
                        isGenerating
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                      disabled={isGenerating}
                      whileHover={!isGenerating ? { scale: 1.02 } : {}}
                      whileTap={!isGenerating ? { scale: 0.98 } : {}}
                    >
                      {isGenerating ? "Generating..." : (
                        <>
                          <RefreshCw className="w-4 h-4 inline mr-1" /> Generate
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description (max 128 chars)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={128}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                    required
                    disabled={isCreating}
                    placeholder="Describe your proposal"
                  />
                </motion.div>

                <motion.button
                  type="submit"
                  className={`w-full font-semibold py-3 px-6 rounded-lg transition shadow-lg flex items-center justify-center ${
                    isCreating ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                  disabled={isCreating}
                  whileHover={!isCreating ? { scale: 1.02 } : {}}
                  whileTap={!isCreating ? { scale: 0.98 } : {}}
                >
                  {isCreating ? "Creating..." : (
                    <>
                      <FileText className="mr-2" /> Create Proposal
                    </>
                  )}
                </motion.button>
              </form>

              {createResult && (
                <motion.div
                  className="mt-6 bg-green-50 border-l-4 border-green-500 p-4 rounded"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="text-lg font-semibold text-green-700 flex items-center">
                    <CheckCircle className="w-6 h-6 mr-2" /> Proposal Created
                  </h3>
                  <div className="space-y-2 text-gray-700 mt-2">
                    <p><strong>Proposal ID:</strong> {createResult.proposalId}</p>
                    <p><strong>Created At:</strong> {createResult.timestamp}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Vote on Proposal */}
            <motion.div
              className="bg-white rounded-xl shadow-xl p-8 border border-gray-100"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <motion.h1
                className="text-3xl font-bold text-gray-800 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <span className="text-green-600">Vote</span> on a Proposal
              </motion.h1>
              <motion.p
                className="text-lg text-gray-600 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                Cast your vote on an existing governance proposal (one vote per wallet).
              </motion.p>

              <form onSubmit={handleVoteProposal} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <label htmlFor="proposalIdVote" className="block text-sm font-medium text-gray-700">
                    Proposal ID
                  </label>
                  <input
                    id="proposalIdVote"
                    type="text"
                    value={proposalIdVote}
                    onChange={(e) => setProposalIdVote(e.target.value)}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                    required
                    disabled={isVoting}
                    placeholder="e.g., PROP-123"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <label className="block text-sm font-medium text-gray-700">Vote</label>
                  <div className="mt-1 flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setVoteFor(true)}
                      className={`flex-1 py-2 px-4 rounded-lg ${
                        voteFor === true
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      disabled={isVoting}
                    >
                      For
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoteFor(false)}
                      className={`flex-1 py-2 px-4 rounded-lg ${
                        voteFor === false
                          ? "bg-red-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      disabled={isVoting}
                    >
                      Against
                    </button>
                  </div>
                </motion.div>

                <motion.button
                  type="submit"
                  className={`w-full font-semibold py-3 px-6 rounded-lg transition shadow-lg flex items-center justify-center ${
                    isVoting || voteFor === null
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                  disabled={isVoting || voteFor === null}
                  whileHover={!isVoting && voteFor !== null ? { scale: 1.02 } : {}}
                  whileTap={!isVoting && voteFor !== null ? { scale: 0.98 } : {}}
                >
                  {isVoting ? "Voting..." : (
                    <>
                      <Vote className="mr-2" /> Cast Vote
                    </>
                  )}
                </motion.button>
              </form>

              {voteResult && (
                <motion.div
                  className={`mt-6 p-4 rounded border-l-4 ${
                    voteResult.vote === "For" ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className={`text-lg font-semibold flex items-center ${
                    voteResult.vote === "For" ? "text-green-700" : "text-red-700"
                  }`}>
                    {voteResult.vote === "For" ? (
                      <CheckCircle className="w-6 h-6 mr-2" />
                    ) : (
                      <XCircle className="w-6 h-6 mr-2" />
                    )}
                    Vote Cast
                  </h3>
                  <div className="space-y-2 text-gray-700 mt-2">
                    <p><strong>Proposal ID:</strong> {voteResult.proposalId}</p>
                    <p><strong>Vote:</strong> {voteResult.vote}</p>
                    <p><strong>Voted At:</strong> {voteResult.timestamp}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Important Note */}
            <motion.div
              className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <p className="text-yellow-700">
                <strong>Important Note:</strong> This governance system is a simple proposal and voting mechanism. The full functionality of the governance system, including execution logic and advanced features, is currently being worked on.
              </p>
            </motion.div>
          </motion.div>

          {/* Right Side: Proposals Dashboard */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl p-8 border border-gray-100"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.h1
                className="text-3xl font-bold text-gray-800 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <span className="text-green-600">Proposals</span> Dashboard
              </motion.h1>
              <motion.p
                className="text-lg text-gray-600 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                View all active governance proposals.
              </motion.p>

              {isFetchingProposals ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ) : proposals.length === 0 ? (
                <p className="text-gray-600">No proposals found.</p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {proposals.map((proposal, index) => (
                    <motion.div
                      key={proposal.proposalId}
                      className="p-4 bg-gray-50 rounded-lg border text-gray-600 border-gray-200"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.5 }}
                    >
                      <p><strong>ID:</strong> {proposal.proposalId}</p>
                      <p><strong>Description:</strong> {proposal.description}</p>
                      <p><strong>Votes For:</strong> {proposal.votesFor}</p>
                      <p><strong>Votes Against:</strong> {proposal.votesAgainst}</p>
                      <p><strong>Voters:</strong> {proposal.voterCount}</p>
                      <p><strong>Status:</strong> {proposal.executed ? "Executed" : "Active"}</p>
                      <p><strong>Created:</strong> {proposal.createdAt}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default GovernancePage;