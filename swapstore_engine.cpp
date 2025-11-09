// swapstore_engine.cpp
// SwapStore: Swap Space Management Simulation Engine
// Handles memory allocation, paging, and page replacement algorithms

#include <iostream>
#include <vector>
#include <queue>
#include <map>
#include <algorithm>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <ctime>

using namespace std;

// Constants
const int PAGE_SIZE = 4096; // 4KB page size

// Page structure
struct Page {
    int pageNumber;
    int processId;
    int frameNumber;
    bool inMemory;
    long lastAccessTime;
    int frequency;

    Page() : pageNumber(-1), processId(-1), frameNumber(-1), 
             inMemory(false), lastAccessTime(0), frequency(0) {}
};

// Process structure
struct Process {
    int processId;
    string fileName;
    long fileSize;
    int numPages;
    vector<Page> pages;

    Process(int id, string name, long size) 
        : processId(id), fileName(name), fileSize(size) {
        numPages = (size + PAGE_SIZE - 1) / PAGE_SIZE;
        pages.resize(numPages);
        for (int i = 0; i < numPages; i++) {
            pages[i].pageNumber = i;
            pages[i].processId = id;
        }
    }
};

// Memory Management Unit
class MemoryManager {
private:
    int ramSize;              // Total RAM in KB
    int numFrames;            // Number of page frames
    int swapSize;             // Swap space size
    vector<int> memory;       // Physical memory frames (-1 if empty)
    vector<Process> processes;
    int nextProcessId;

    // Statistics
    int pageFaults;
    int pageHits;
    int swapOuts;
    int swapIns;

public:
    MemoryManager(int ramKB) : ramSize(ramKB), nextProcessId(0), 
                                pageFaults(0), pageHits(0), 
                                swapOuts(0), swapIns(0) {
        numFrames = (ramSize * 1024) / PAGE_SIZE;
        memory.resize(numFrames, -1);
        swapSize = ramSize * 2; // Swap is 2x RAM
    }

    // Add a process (file)
    int addProcess(string fileName, long fileSize) {
        Process proc(nextProcessId++, fileName, fileSize);
        processes.push_back(proc);
        return proc.processId;
    }

    // FIFO Page Replacement
    string fifoPageReplacement(int processId, int pageNumber) {
        static queue<pair<int, int>> fifoQueue;

        // Check if page is already in memory
        for (int i = 0; i < numFrames; i++) {
            if (memory[i] != -1) {
                int pid = memory[i] / 10000;
                int pnum = memory[i] % 10000;
                if (pid == processId && pnum == pageNumber) {
                    pageHits++;
                    return generateResponse("HIT", processId, pageNumber, i, -1);
                }
            }
        }

        // Page fault
        pageFaults++;

        // Find empty frame
        for (int i = 0; i < numFrames; i++) {
            if (memory[i] == -1) {
                memory[i] = processId * 10000 + pageNumber;
                fifoQueue.push({processId, pageNumber});
                swapIns++;
                return generateResponse("MISS", processId, pageNumber, i, -1);
            }
        }

        // Replace using FIFO
        auto victim = fifoQueue.front();
        fifoQueue.pop();

        // Find victim frame
        int victimFrame = -1;
        for (int i = 0; i < numFrames; i++) {
            if (memory[i] == victim.first * 10000 + victim.second) {
                victimFrame = i;
                break;
            }
        }

        memory[victimFrame] = processId * 10000 + pageNumber;
        fifoQueue.push({processId, pageNumber});
        swapOuts++;
        swapIns++;

        return generateResponse("MISS", processId, pageNumber, victimFrame, 
                               victim.first * 10000 + victim.second);
    }

    // LRU Page Replacement
    string lruPageReplacement(int processId, int pageNumber) {
        static map<pair<int, int>, long> accessTime;
        static long currentTime = 0;

        currentTime++;

        // Check if page is in memory
        for (int i = 0; i < numFrames; i++) {
            if (memory[i] != -1) {
                int pid = memory[i] / 10000;
                int pnum = memory[i] % 10000;
                if (pid == processId && pnum == pageNumber) {
                    pageHits++;
                    accessTime[{pid, pnum}] = currentTime;
                    return generateResponse("HIT", processId, pageNumber, i, -1);
                }
            }
        }

        // Page fault
        pageFaults++;

        // Find empty frame
        for (int i = 0; i < numFrames; i++) {
            if (memory[i] == -1) {
                memory[i] = processId * 10000 + pageNumber;
                accessTime[{processId, pageNumber}] = currentTime;
                swapIns++;
                return generateResponse("MISS", processId, pageNumber, i, -1);
            }
        }

        // Find LRU page
        long minTime = LONG_MAX;
        int victimFrame = -1;
        int victimPage = -1;

        for (int i = 0; i < numFrames; i++) {
            int pid = memory[i] / 10000;
            int pnum = memory[i] % 10000;
            long time = accessTime[{pid, pnum}];
            if (time < minTime) {
                minTime = time;
                victimFrame = i;
                victimPage = memory[i];
            }
        }

        memory[victimFrame] = processId * 10000 + pageNumber;
        accessTime[{processId, pageNumber}] = currentTime;
        swapOuts++;
        swapIns++;

        return generateResponse("MISS", processId, pageNumber, victimFrame, victimPage);
    }

    // Optimal Page Replacement
    string optimalPageReplacement(int processId, int pageNumber, 
                                  vector<pair<int, int>>& futureReferences) {
        // Check if page is in memory
        for (int i = 0; i < numFrames; i++) {
            if (memory[i] != -1) {
                int pid = memory[i] / 10000;
                int pnum = memory[i] % 10000;
                if (pid == processId && pnum == pageNumber) {
                    pageHits++;
                    return generateResponse("HIT", processId, pageNumber, i, -1);
                }
            }
        }

        // Page fault
        pageFaults++;

        // Find empty frame
        for (int i = 0; i < numFrames; i++) {
            if (memory[i] == -1) {
                memory[i] = processId * 10000 + pageNumber;
                swapIns++;
                return generateResponse("MISS", processId, pageNumber, i, -1);
            }
        }

        // Find page that won't be used for longest time
        int farthest = -1;
        int victimFrame = -1;
        int victimPage = -1;

        for (int i = 0; i < numFrames; i++) {
            int pid = memory[i] / 10000;
            int pnum = memory[i] % 10000;

            int nextUse = INT_MAX;
            for (size_t j = 0; j < futureReferences.size(); j++) {
                if (futureReferences[j].first == pid && 
                    futureReferences[j].second == pnum) {
                    nextUse = j;
                    break;
                }
            }

            if (nextUse > farthest) {
                farthest = nextUse;
                victimFrame = i;
                victimPage = memory[i];
            }
        }

        memory[victimFrame] = processId * 10000 + pageNumber;
        swapOuts++;
        swapIns++;

        return generateResponse("MISS", processId, pageNumber, victimFrame, victimPage);
    }

    string generateResponse(string type, int pid, int page, int frame, int victim) {
        stringstream ss;
        ss << "{";
        ss << "\"type\": \"" << type << "\", ";
        ss << "\"processId\": " << pid << ", ";
        ss << "\"pageNumber\": " << page << ", ";
        ss << "\"frameNumber\": " << frame << ", ";
        ss << "\"victimPage\": " << victim << ", ";
        ss << "\"pageFaults\": " << pageFaults << ", ";
        ss << "\"pageHits\": " << pageHits << ", ";
        ss << "\"swapOuts\": " << swapOuts << ", ";
        ss << "\"swapIns\": " << swapIns;
        ss << "}";
        return ss.str();
    }

    string getMemoryState() {
        stringstream ss;
        ss << "{";
        ss << "\"ramSize\": " << ramSize << ", ";
        ss << "\"numFrames\": " << numFrames << ", ";
        ss << "\"memory\": [";
        for (int i = 0; i < numFrames; i++) {
            if (i > 0) ss << ", ";
            ss << memory[i];
        }
        ss << "], ";
        ss << "\"processes\": " << processes.size() << ", ";
        ss << "\"pageFaults\": " << pageFaults << ", ";
        ss << "\"pageHits\": " << pageHits << ", ";
        ss << "\"swapOuts\": " << swapOuts << ", ";
        ss << "\"swapIns\": " << swapIns;
        ss << "}";
        return ss.str();
    }

    void reset() {
        fill(memory.begin(), memory.end(), -1);
        pageFaults = 0;
        pageHits = 0;
        swapOuts = 0;
        swapIns = 0;
    }

    int getNumFrames() { return numFrames; }
    int getPageFaults() { return pageFaults; }
    int getPageHits() { return pageHits; }
};

// Main entry point for simulation
int main() {
    cout << "SwapStore Engine Ready" << endl;
    cout << "Enter RAM size in KB: ";

    int ramSize;
    cin >> ramSize;

    MemoryManager mm(ramSize);

    cout << "Memory Manager initialized with " << mm.getNumFrames() 
         << " frames" << endl;

    // Example simulation
    cout << "\nSimulation commands:" << endl;
    cout << "1. ADD <filename> <filesize>" << endl;
    cout << "2. FIFO <pid> <page>" << endl;
    cout << "3. LRU <pid> <page>" << endl;
    cout << "4. STATE" << endl;
    cout << "5. RESET" << endl;
    cout << "6. EXIT" << endl;

    string command;
    while (cin >> command) {
        if (command == "ADD") {
            string filename;
            long filesize;
            cin >> filename >> filesize;
            int pid = mm.addProcess(filename, filesize);
            cout << "Process added with ID: " << pid << endl;
        }
        else if (command == "FIFO") {
            int pid, page;
            cin >> pid >> page;
            cout << mm.fifoPageReplacement(pid, page) << endl;
        }
        else if (command == "LRU") {
            int pid, page;
            cin >> pid >> page;
            cout << mm.lruPageReplacement(pid, page) << endl;
        }
        else if (command == "STATE") {
            cout << mm.getMemoryState() << endl;
        }
        else if (command == "RESET") {
            mm.reset();
            cout << "Memory reset complete" << endl;
        }
        else if (command == "EXIT") {
            break;
        }
    }

    return 0;
}
