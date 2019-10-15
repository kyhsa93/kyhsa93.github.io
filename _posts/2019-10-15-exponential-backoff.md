---
layout: post
title: Exponential backoff algorithm
date: 2019-10-15 +0900
author: kyhsa93
categories: algorithm
cover: "/assets/exponential_backoff.png"
---

# Exponential Backoff

오류 재시도를 위한 지수 백오프 알고리즘

## Implementing Exponential Backoff

---

When services in MSA calls other services without waiting, they can produce a heavy load on the infrastructure.

Even small fraction of overactive services can trigger limits that affect all services in the same infrastructure.

To avoid triggering these limits, you are strongly encouraged to implement truncated exponential backoff with jitter.

Truncated exponential backoff is a standard error handling strategy for network applications.

In this approach, a client periodically retries a failed request with increasing delays between requests.

Example algorithm

An exponential backoff algorithm retries requests exponentially, increasing the waiting time between retries up to a maximum backoff time. For example:

1. Make request to services.
2. If the request fails, wait 1 + random_number_milliseconds seconds and retry the request.
3. If the request fails, wait 2 + random_number_milliseconds seconds and retry the request.
4. If the request fails, wait 4 + random_number_milliseconds seconds and retry the request.
5. And so on, up to a maximum_backoff time.
6. Continue waiting and retrying up to some maximum number of retries, but do not increase the wait period between reties.

The wait time is min (((2^n) + random_number_milliseconds), maximum_backoff), with n incremented by 1 for each iteration(or request).

random_number_milliseconds is helps to avoid cases in which many clients are synchronizes by some situation and all retry at once, sending requests in synchronized waves.

The value of random_number_milliseconds is recalculated after each retry request.

maximum_backoff is typically 32 or 64 seconds.

The appropriate value depends on the use case.

The client can continue retrying after it has reached the maximum_backoff time.

Retries after this point do not need to continue increasing backoff time.

For example, suppose a client uses a maximum_backoff time of 64 seconds.

After reaching this value, the client can retry every 64 seconds.

At some point, clients should be prevented from retrying indefinitely.

The wait time between retries and the number of retires depend on your use case and network conditions.

## Backoff in Network system

---

A host which has experienced a collision on a network waits for a amount of time before attempting to retransmit.

A random backoff minimizes the probability that the same nodes will collide again, even if they are using the same backoff algorithm.

Increasing the backoff period after each collision also helps to prevent repeated collisions, especially when the network is heavily loaded.

## Truncated binary exponential backoff

---

In a variety of computer networks, binary exponential backoff or truncated exponential backoff refer to an algorithm used to space out repeated retransmissions of the same block of data.

Examples are the retransmission of frames in carrier sense multiple access with collision avoidance (CSMA/CA) and carrier sense multiple access with collision detection (CSMA/CD) networks, where this algorithm is part of the channel access method used to send data on these network.

In Ethernet networks, the algorithm is commonly used to schedule retransmissions after collisions.

The retransmission is delayed by an amount of time derived from the slot time and the number of attempts to retransmit.

After I collisions, a random number of slot times between 0 and 2i - 1 is chosen.

For the first collision, each sender might wait 0 or 1 slot times.

After the second collision, the senders might wait 0, 1, 2 or 3 slot times, and so forth.

As the number of retransmission attempts increases, the number of possibilities for delay increase.

The `truncated` simply means that after a certain number of increases, the exponentiation stops.

i.e. the retransmission timeout reaches a ceiling, and thereafter does not increase any further.

For example, if the ceiling is set at I = 10, then the maximum delay is 1023 slot times.

Because these delays cause other stations who are sending to collide as wall, there is a possibility that, on a busy network, hundreds of people may be caught in a single collision set.

Because of this possibility, after 16 attempts at transmission, the process is aborted.
