/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/decentralized_ag_supply.json`.
 */
export type DecentralizedAgSupply = {
  "address": "6dqYYEBGfD6JdnYYYUekhd5QPKJPQYHmBA3RASMuBb6o",
  "metadata": {
    "name": "decentralizedAgSupply",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "confirmDelivery",
      "discriminator": [
        11,
        109,
        227,
        53,
        179,
        190,
        88,
        155
      ],
      "accounts": [
        {
          "name": "produce",
          "writable": true
        },
        {
          "name": "retailerAccount",
          "writable": true
        },
        {
          "name": "retailer",
          "signer": true
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "paymentVault",
          "writable": true
        },
        {
          "name": "farmerPaymentAccount",
          "writable": true
        },
        {
          "name": "transporterPaymentAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "confirmPickup",
      "discriminator": [
        37,
        5,
        149,
        215,
        41,
        79,
        248,
        82
      ],
      "accounts": [
        {
          "name": "produce",
          "writable": true
        },
        {
          "name": "farmerAccount",
          "writable": true
        },
        {
          "name": "farmer",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "createProposal",
      "discriminator": [
        132,
        116,
        68,
        174,
        216,
        160,
        198,
        22
      ],
      "accounts": [
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "proposalId"
              }
            ]
          }
        },
        {
          "name": "proposer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u64"
        },
        {
          "name": "description",
          "type": "string"
        }
      ]
    },
    {
      "name": "executeProposal",
      "discriminator": [
        186,
        60,
        116,
        133,
        108,
        128,
        111,
        28
      ],
      "accounts": [
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "proposal.proposal_id",
                "account": "governanceProposal"
              }
            ]
          }
        },
        {
          "name": "executor",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "fundVault",
      "discriminator": [
        26,
        33,
        207,
        242,
        119,
        108,
        134,
        73
      ],
      "accounts": [
        {
          "name": "produce",
          "writable": true
        },
        {
          "name": "retailer",
          "writable": true,
          "signer": true
        },
        {
          "name": "retailerTokenAccount",
          "writable": true
        },
        {
          "name": "paymentVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeVault",
      "discriminator": [
        48,
        191,
        163,
        44,
        71,
        129,
        63,
        164
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "paymentVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "logHarvest",
      "discriminator": [
        35,
        162,
        14,
        136,
        29,
        210,
        195,
        26
      ],
      "accounts": [
        {
          "name": "produce",
          "writable": true
        },
        {
          "name": "farmerAccount",
          "writable": true
        },
        {
          "name": "farmer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "produceId",
          "type": "u64"
        },
        {
          "name": "produceType",
          "type": "string"
        },
        {
          "name": "quantity",
          "type": "u64"
        },
        {
          "name": "harvestDate",
          "type": "i64"
        },
        {
          "name": "quality",
          "type": "u8"
        },
        {
          "name": "qrCodeUri",
          "type": "string"
        },
        {
          "name": "farmerPrice",
          "type": "u64"
        },
        {
          "name": "transporterFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "processPayment",
      "discriminator": [
        189,
        81,
        30,
        198,
        139,
        186,
        115,
        23
      ],
      "accounts": [
        {
          "name": "produce",
          "writable": true
        },
        {
          "name": "farmerPaymentAccount",
          "writable": true
        },
        {
          "name": "transporterPaymentAccount",
          "writable": true
        },
        {
          "name": "paymentVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "raiseDispute",
      "discriminator": [
        41,
        243,
        1,
        51,
        150,
        95,
        246,
        73
      ],
      "accounts": [
        {
          "name": "produce",
          "writable": true
        },
        {
          "name": "raiser",
          "writable": true,
          "signer": true
        },
        {
          "name": "dispute",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  105,
                  115,
                  112,
                  117,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "produce"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "description",
          "type": "string"
        }
      ]
    },
    {
      "name": "recordDelivery",
      "discriminator": [
        72,
        245,
        251,
        211,
        129,
        177,
        93,
        214
      ],
      "accounts": [
        {
          "name": "produce",
          "writable": true
        },
        {
          "name": "transporterAccount",
          "writable": true
        },
        {
          "name": "transporter",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "recordPickup",
      "discriminator": [
        133,
        238,
        8,
        81,
        210,
        250,
        186,
        73
      ],
      "accounts": [
        {
          "name": "produce",
          "writable": true
        },
        {
          "name": "transporterAccount",
          "writable": true
        },
        {
          "name": "transporter",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "temperature",
          "type": "i16"
        },
        {
          "name": "humidity",
          "type": "u8"
        }
      ]
    },
    {
      "name": "registerParticipant",
      "discriminator": [
        248,
        112,
        38,
        215,
        226,
        230,
        249,
        40
      ],
      "accounts": [
        {
          "name": "participant",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  114,
                  116,
                  105,
                  99,
                  105,
                  112,
                  97,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "role",
          "type": {
            "defined": {
              "name": "participantRole"
            }
          }
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "contactInfo",
          "type": "string"
        }
      ]
    },
    {
      "name": "resolveDispute",
      "discriminator": [
        231,
        6,
        202,
        6,
        96,
        103,
        12,
        230
      ],
      "accounts": [
        {
          "name": "dispute",
          "writable": true
        },
        {
          "name": "produce",
          "writable": true
        },
        {
          "name": "arbitratorAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  114,
                  116,
                  105,
                  99,
                  105,
                  112,
                  97,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "arbitrator"
              }
            ]
          }
        },
        {
          "name": "arbitrator",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "resolution",
          "type": "bool"
        }
      ]
    },
    {
      "name": "stakeTokens",
      "discriminator": [
        136,
        126,
        91,
        162,
        40,
        131,
        13,
        127
      ],
      "accounts": [
        {
          "name": "staker",
          "writable": true,
          "signer": true
        },
        {
          "name": "stakerTokenAccount",
          "writable": true
        },
        {
          "name": "stakeVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unstakeTokens",
      "discriminator": [
        58,
        119,
        215,
        143,
        203,
        223,
        32,
        86
      ],
      "accounts": [
        {
          "name": "staker",
          "writable": true,
          "signer": true
        },
        {
          "name": "stakerTokenAccount",
          "writable": true
        },
        {
          "name": "stakeVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "verifyQuality",
      "discriminator": [
        53,
        102,
        132,
        199,
        27,
        42,
        97,
        41
      ],
      "accounts": [
        {
          "name": "produce",
          "writable": true
        },
        {
          "name": "verifierAccount",
          "writable": true
        },
        {
          "name": "verifier",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "verifiedQuality",
          "type": "u8"
        }
      ]
    },
    {
      "name": "voteProposal",
      "discriminator": [
        247,
        104,
        114,
        240,
        237,
        41,
        200,
        36
      ],
      "accounts": [
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "proposal.proposal_id",
                "account": "governanceProposal"
              }
            ]
          }
        },
        {
          "name": "voter",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u64"
        },
        {
          "name": "voteFor",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "dispute",
      "discriminator": [
        36,
        49,
        241,
        67,
        40,
        36,
        241,
        74
      ]
    },
    {
      "name": "governanceProposal",
      "discriminator": [
        53,
        107,
        240,
        190,
        43,
        73,
        65,
        143
      ]
    },
    {
      "name": "participant",
      "discriminator": [
        32,
        142,
        108,
        79,
        247,
        179,
        54,
        6
      ]
    },
    {
      "name": "produce",
      "discriminator": [
        202,
        115,
        118,
        182,
        195,
        125,
        51,
        61
      ]
    },
    {
      "name": "vault",
      "discriminator": [
        211,
        8,
        232,
        43,
        2,
        152,
        117,
        119
      ]
    }
  ],
  "events": [
    {
      "name": "disputeRaised",
      "discriminator": [
        246,
        167,
        109,
        37,
        142,
        45,
        38,
        176
      ]
    },
    {
      "name": "harvestLogged",
      "discriminator": [
        120,
        78,
        199,
        142,
        215,
        123,
        47,
        146
      ]
    },
    {
      "name": "proposalCreated",
      "discriminator": [
        186,
        8,
        160,
        108,
        81,
        13,
        51,
        206
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "nameTooLong",
      "msg": "Name exceeds maximum length of 32 characters"
    },
    {
      "code": 6001,
      "name": "contactInfoTooLong",
      "msg": "Contact info exceeds maximum length of 64 characters"
    }
  ],
  "types": [
    {
      "name": "dispute",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "produce",
            "type": "pubkey"
          },
          {
            "name": "raiser",
            "type": "pubkey"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "resolved",
            "type": "bool"
          },
          {
            "name": "resolution",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "disputeRaised",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "produce",
            "type": "pubkey"
          },
          {
            "name": "raiser",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "governanceProposal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposalId",
            "type": "u64"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "votesFor",
            "type": "u64"
          },
          {
            "name": "votesAgainst",
            "type": "u64"
          },
          {
            "name": "executed",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "voters",
            "type": {
              "vec": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "harvestLogged",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "produceId",
            "type": "u64"
          },
          {
            "name": "farmer",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "participant",
      "docs": [
        "Participant account that stores identity details."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "role",
            "type": {
              "defined": {
                "name": "participantRole"
              }
            }
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "contactInfo",
            "type": "string"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "participantRole",
      "docs": [
        "Defines the different participant roles."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "farmer"
          },
          {
            "name": "transporter"
          },
          {
            "name": "wholesaler"
          },
          {
            "name": "retailer"
          },
          {
            "name": "arbitrator"
          }
        ]
      }
    },
    {
      "name": "produce",
      "docs": [
        "The Produce account tracks a batch from harvest to market."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "produceId",
            "type": "u64"
          },
          {
            "name": "farmer",
            "type": "pubkey"
          },
          {
            "name": "produceType",
            "type": "string"
          },
          {
            "name": "quantity",
            "type": "u64"
          },
          {
            "name": "harvestDate",
            "type": "i64"
          },
          {
            "name": "quality",
            "type": "u8"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "produceStatus"
              }
            }
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          },
          {
            "name": "transportTemp",
            "type": "i16"
          },
          {
            "name": "transportHumidity",
            "type": "u8"
          },
          {
            "name": "pickupConfirmed",
            "type": "bool"
          },
          {
            "name": "deliveryConfirmed",
            "type": "bool"
          },
          {
            "name": "disputeRaised",
            "type": "bool"
          },
          {
            "name": "verifiedQuality",
            "type": "u8"
          },
          {
            "name": "qrCodeUri",
            "type": "string"
          },
          {
            "name": "farmerPrice",
            "type": "u64"
          },
          {
            "name": "transporterFee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "produceStatus",
      "docs": [
        "Different states of a produce batch."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "harvested"
          },
          {
            "name": "pickedUp"
          },
          {
            "name": "inTransit"
          },
          {
            "name": "delivered"
          },
          {
            "name": "qualityVerified"
          },
          {
            "name": "disputed"
          }
        ]
      }
    },
    {
      "name": "proposalCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposalId",
            "type": "u64"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "vault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
