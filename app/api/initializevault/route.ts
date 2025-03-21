import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, Transaction, SystemProgram, Keypair, Connection } from "@solana/web3.js";
import rawIdl from "../../../idl.json";
import type { DecentralizedAgSupply } from "../../../types/decentralized_ag_supply";
import { NextResponse } from "next/server";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const programId = new PublicKey(rawIdl.address);
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY
  ? JSON.parse(process.env.ADMIN_SECRET_KEY)
  : null;
const adminKeypair = ADMIN_SECRET_KEY ? Keypair.fromSecretKey(new Uint8Array(ADMIN_SECRET_KEY)) : null;

export async function GET() {
  if (!adminKeypair) {
    return NextResponse.json(
      { error: "Admin keypair not configured" },
      { status: 500 }
    );
  }

  try {
    const provider = new AnchorProvider(connection, {
      publicKey: adminKeypair.publicKey,
      signTransaction: async (tx) => {
        (tx as Transaction).partialSign(adminKeypair);
        return tx;
      },
      signAllTransactions: async (txs) => {
        txs.forEach((tx) => (tx as Transaction).partialSign(adminKeypair));
        return txs;
      },
    }, { commitment: "confirmed" });

    const program = new Program(rawIdl as unknown as DecentralizedAgSupply, provider);

    // Derive PDAs
    const [vaultPDA, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      programId
    );
    const [paymentVaultPDA, paymentVaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_token")],
      programId
    );

    console.log("Admin Public Key:", adminKeypair.publicKey.toBase58());
    console.log("Vault PDA:", vaultPDA.toBase58(), "Bump:", vaultBump);
    console.log("Payment Vault PDA:", paymentVaultPDA.toBase58(), "Bump:", paymentVaultBump);

    // Check if vault is already initialized
    const vaultAccount = await connection.getAccountInfo(vaultPDA);
    if (vaultAccount) {
      return NextResponse.json(
        { message: "Vault already initialized", vaultPDA: vaultPDA.toBase58(), paymentVaultPDA: paymentVaultPDA.toBase58() },
        { status: 200 }
      );
    }

    const mint = new PublicKey("So11111111111111111111111111111111111111112"); // Wrapped SOL
    console.log("Mint:", mint.toBase58());

    // Check admin balance
    const balance = await connection.getBalance(adminKeypair.publicKey);
    console.log("Admin SOL Balance:", balance / 1e9, "SOL");
    if (balance < 0.01 * 1e9) { // 0.01 SOL minimum
      throw new Error("Insufficient SOL in admin account. Need at least 0.01 SOL.");
    }

    // Build the transaction
    const transaction = new Transaction();

    const initializeVaultIx = await program.methods
      .initializeVault()
      .accounts({
        vault: vaultPDA,
        paymentVault: paymentVaultPDA,
        mint: mint,
        authority: adminKeypair.publicKey, // Explicitly set to admin key
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: new PublicKey("SysvarRent111111111111111111111111111111111"),
      })
      .instruction();

    transaction.add(initializeVaultIx);

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = adminKeypair.publicKey;

    console.log("Transaction accounts:", transaction.instructions[0].keys.map(k => ({
      pubkey: k.pubkey.toBase58(),
      isSigner: k.isSigner,
      isWritable: k.isWritable
    })));

    // Simulate the transaction
    const simulation = await connection.simulateTransaction(transaction);
    if (simulation.value.err) {
      console.error("Simulation failed:", simulation.value.logs);
      throw new Error("Simulation failed: " + JSON.stringify(simulation.value.err));
    }

    // Sign and send
    const signedTx = await provider.wallet.signTransaction(transaction);
    const txId = await connection.sendRawTransaction(signedTx.serialize(), { skipPreflight: false });
    
    console.log("Transaction sent:", txId);

    await connection.confirmTransaction({
      signature: txId,
      blockhash,
      lastValidBlockHeight,
    });

    console.log("Transaction confirmed");

    return NextResponse.json(
      {
        success: true,
        txId,
        vaultPDA: vaultPDA.toBase58(),
        paymentVaultPDA: paymentVaultPDA.toBase58(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error initializing vault:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize vault",
        details: (error instanceof Error ? error.message : String(error)) + " (Check server logs for more details)",
      },
      { status: 500 }
    );
  }
}