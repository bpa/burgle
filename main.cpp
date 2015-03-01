#include <cstdlib>
#include <iostream>
#include <iomanip>
#include <string.h>
#include <deque>
#include <bitset>
#include <set>

using namespace std;

struct work {
    int base;
    int left;
    int right;
};

deque<int> configurations;
set<int> unique_configurations;

void generate() {
    int total = 1;
    deque<struct work> work_queue;
    work_queue.push_back({0xFF, 7, 23});
    configurations.push_back(0xFF);
    while (!work_queue.empty()) {
        struct work next = work_queue.front();
        work_queue.pop_front();
        int mask = 3 << next.left;
        int next_bit = next.left - 1;

        while (next_bit >= 0 && next.base & (1 << next_bit) == 0)
            next_bit--;

        for (int i = next.left; i < next.right; i++) {
            next.base ^= mask;
            configurations.push_back(next.base);
            total++;
            if (next_bit >= 0)
                work_queue.push_back({next.base, next_bit, i});
            mask <<= 1;
        }

    }
    cout << total << " configurations found" << endl;
}

void convert(int floor, char *layout) {
    memset(layout, 15, 16);
    for (int y = 0; y < 3; y++) {
        for (int x = 0; x < 4; x++) {
            int y_offset = y * 4 + x;

            if ((floor & (1 << y_offset)) == 0) {
                char *ind = &layout[y_offset];
                *ind = *ind & (char) 0xB;
                ind += 4;
                *ind = *ind & (char) 0xE;
            }

            int x_offset = (y + 3) * 4 + x;
            if ((floor & (1 << x_offset)) == 0) {
                char *ind = &layout[x * 4 + y];
                *ind = *ind & (char) 0xD;
                ind++;
                *ind = *ind & (char) 0x7;
            }
        }
    }
}

inline int mirror(int layout) {
    int mirrored = (layout & 0xF) << 8;
    mirrored = mirrored | (layout & 0xF0);
    mirrored = mirrored | ((layout & 0xF00) >> 8);
    mirrored = mirrored | ((layout & 0x333000) << 2);
    mirrored = mirrored | ((layout & 0xCCC000) >> 2);
    return mirrored;
}

inline int rotate(int layout) {
    int rotated = (layout & 0xF) << 20;
    rotated = rotated | ((layout & 0xF0)) << 12;
    rotated = rotated | ((layout & 0xF00)) << 4;
    rotated = rotated | ((layout & 0x111000)) >> 9;
    rotated = rotated | ((layout & 0x222000)) >> 11;
    rotated = rotated | ((layout & 0x444000)) >> 13;
    rotated = rotated | ((layout & 0x888000)) >> 15;
    return rotated;
}

void print_floor(char *floor) {
    for (int y = 0; y < 4; y++) {
        for (int x = 0; x < 4; x++) {
            switch (floor[y * 4 + x] & 0b1011) {
                case 0: cout << "  ";
                    break;
                case 1: cout << "╶╴";
                    break;
                case 2: cout << " ╷";
                    break;
                case 3: cout << "╶╮";
                    break;
                case 8: cout << "╷ ";
                    break;
                case 9: cout << "╭╴";
                    break;
                case 10: cout << "╷╷";
                    break;
                case 11: cout << "╭╮";
                    break;
            }
        }
        cout << endl;
        for (int x = 0; x < 4; x++) {
            switch (floor[y * 4 + x] & 0b1110) {
                case 0: cout << "  ";
                    break;
                case 2: cout << " ╵";
                    break;
                case 4: cout << "╶╴";
                    break;
                case 6: cout << "╶╯";
                    break;
                case 8: cout << "╵ ";
                    break;
                case 10: cout << "╵╵";
                    break;
                case 12: cout << "╰╴";
                    break;
                case 14: cout << "╰╯";
                    break;
            }
        }
        cout << endl;
    }
}

void print_layout(int layout) {
    char floor[16];
    convert(layout, &floor[0]);
    print_floor(&floor[0]);
}

void remove_duplicates() {
    while (!configurations.empty()) {
        int next = configurations.front();
        configurations.pop_front();
        int rotated_mirror = mirror(next);
        unique_configurations.erase(rotated_mirror);
        int rotated = next;
        for (int i = 0; i < 3; i++) {
            rotated = rotate(rotated);
            rotated_mirror = rotate(rotated_mirror);
            unique_configurations.erase(rotated);
            unique_configurations.erase(rotated_mirror);
        }
        unique_configurations.insert(next);
    }
    cout << unique_configurations.size() << " unique configurations found" << endl;
}

void remove_invalid() {
    int valid = 0;
    deque<int> tiles;
    char layout[16];
    for (auto f : unique_configurations) {
        int visited = 0;
        convert(f, &layout[0]);
//        print_floor(&layout[0]);
        tiles.push_front(0);
        while (!tiles.empty()) {
            int next = tiles.front();
            tiles.pop_front();
            char tile = layout[next];
            if (tile > 15) continue;
            layout[next] |= 0x10;
            if ((tile & 1) == 0) tiles.push_front(next - 4);
            if ((tile & 2) == 0) tiles.push_front(next + 1);
            if ((tile & 4) == 0) tiles.push_front(next + 4);
            if ((tile & 8) == 0) tiles.push_front(next - 1);
            visited++;
        }
        if (visited == 16) valid++;
    }
    cout << valid << " valid unique configurations found" << endl;
}

int main(int argc, char** argv) {
    generate();
    remove_duplicates();
    remove_invalid();
    //    int floor = 0b0110011001010100001000000000;
    //    int floor = 0xF0;
    //    print_layout(floor);
    //    floor = mirror(floor);
    //    print_layout(floor);
    return 0;
}

