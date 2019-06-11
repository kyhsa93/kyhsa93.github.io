---
layout: post
title: Raft Understandable Distributed Consensus
date: 2019-06-11 +0900
author: kyhsa93
category: algorithm
cover: "/assets/raft.png"
---

# Raft Understandable Distributed Consensus

## What is Raft?

Raft is a consensus algorithm that is designed to be easy to understand. It's equivalent to Paxos in fault-tolerance and performance. The difference is that it's decomposed into relatively independent subproblems, and it cleanly addresses all major pieces needed for practical systems. We hope Raft will make consensus available to a wider audience, and that this wider audience will be able to develop a variety of higher quality consensus-based systems than are available today.

## So What is Distributed Consensus?

Consensus is a fundamental problem in fault-tolerant distributed systems. Consensus involves multiple servers agreeing on values. Once they reach a decision on a value, that decision is final. Typical consensus algorithms make progress when any majority of their servers is available; for example, a cluster of 5 servers can continue to operate even if 2 servers fail. If more servers fail, they stop making progress (but will never return an incorrect result).

Consensus typically arises in the context of replicated state machines, a general approach to building fault-tolerant systems. Each server has a state machine and a log. The state machine is the component that we want to make fault-tolerant, such as a hash table. It will appear to clients that they are interacting with a single, reliable state machine, even if a minority of the servers in the cluster fail. Each state machine takes as input commands from its log. In our hash table example, the log would include commands like set x to 3. A consensus algorithm is used to agree on the commands in the servers' logs. The consensus algorithm must ensure that if any state machine applies set x to 3 as the nth command, no other state machine will ever apply a different nth command. As a result, each state machine processes the same series of commands and thus produces the same series of results and arrives at the same series of states.

## Leader Election

Let's say we have a single node system. For this example, you can think of our node as a database server that stores a single value. We also have a client that can send a value to the server. Coming to agreement, or consensus, on that value is easy with one node.

But how do we come to consensus if we have multiple nodes?

That's the problem of distributed consensus. Raft is a protocol for implementing distributed consensus. Let's look at a high level overview of how it works.

A node can be in 1 of 3 states: The Follower state, the Candidate state, or the Leader state.

All our nodes start in the follower state. If followers don't hear from a leader then they can become a candidate. The candidate then requests votes from other nodes. Nodes will reply with their vote. The candidate becomes the leader if it gets votes from a majority of nodes.

This process is called Leader Election.

In Raft there are two timeout settings which control elections.

First is the election timeout. The election timeout is the amount of time a follower waits until becoming a candidate and it is randomized to be between 150ms and 300ms. After the election timeout the follower becomes a candidate and starts a new election term.

The vote is started, votes for itself and sends out Request Vote messages to other nodes. If the receiving node hasn't voted yet in this term then it votes for the candidate and the node resets its election timeout. Once a candidate has a majority of votes it becomes leader and begins sending out Append Entries messages to its followers. These messages are sent in intervals specified by the heartbeat timeout. Followers then respond to each Append Entries message. This election term will continue until a follower stops receiving heartbeats and becomes a candidate.

Let's stop the leader and watch a re-election happen and than another node is now leader of second term.

Requiring a majority of votes guarantees that only one leader can be elected per term.

If two nodes become candidates at the same time then a split vote can occur.

Let's take a look at a split vote example.

Two nodes both start an election for the same term and each reaches a single follower node before the other. Now each candidate has 2 votes and can receive no more for this term. The nodes will wait for a new election and try again. One of node received a majority of votes in term some so it becomes leader.

## Log Replication

All changes to the system now go through the leader. Each change is added as an entry in the node's log. This log entry is currently uncommitted so it won't update the node's value.

To commit the entry the node first replicates it to the follower nodes... then the leader waits until a majority of nodes have written the entry.

The entry is now committed on the leader node and the node state is changed. The leader then notifies the followers that the entry is committed. The cluster has now come to consensus about the system state.

This process is called Log Replication.

Once we have a leader elected we need to replicate all changes to our system to all nodes. This is done by using the same Append Entries message that was used for heartbeats.

Let's walk through the process.

First a client sends a change to the leader. The change is appended to the leader's log then the change is sent to the followers on the next heartbeat.

An entry is committed once a majority of followers acknowledge it and a response is sent to the client.

Now let's send a command to update the value by "2" and our system value is now updated to "2".

Raft can even stay consistent in the face of network partitions. Let's add a partition to separate A & B from C, D & E. Because of our partition we now have two leaders in different terms.

Let's add another client and try to update both leaders. One client will try to set the value of node B to "3". Node B cannot replicate to a majority so its log entry stays uncommitted. The other client will try to set the value of node C to "8". This will succeed because it can replicate to a majority.

Now let's heal the network partition.

Node B will see the higher election term and step down. Both nodes A & B will roll back their uncommitted entries and match the new leader's log. Our log is now consistent across our cluster.
