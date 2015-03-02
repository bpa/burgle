#include <cstdlib>
#include <iostream>
#include <iomanip>
#include <string.h>
#include <deque>
#include <bitset>
#include <set>

using namespace std;

typedef int Heat[16];
typedef char Floor[16];
typedef int DistMap[256];

struct work {
    int base;
    int left;
    int right;
};

int heat_min = 1000;
int heat_min_layout = 0;
int heat_max = 0;
int heat_max_layout = 0;

deque<int> configurations;
set<int> unique_configurations;

void generate(int walls) {
    int total = 1;
    int start = (1 << walls) - 1;
    deque<struct work> work_queue;
    work_queue.push_back({start, walls - 1, 23});
    configurations.push_back(start);
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

void convert(int layout, char *floor) {
    memset(floor, 15, 16);
    for (int y = 0; y < 3; y++) {
        for (int x = 0; x < 4; x++) {
            int y_offset = y * 4 + x;

            if ((layout & (1 << y_offset)) == 0) {
                char *ind = &floor[y_offset];
                *ind = *ind & (char) 0xB;
                ind += 4;
                *ind = *ind & (char) 0xE;
            }

            int x_offset = (y + 3) * 4 + x;
            if ((layout & (1 << x_offset)) == 0) {
                char *ind = &floor[x * 4 + y];
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

void print_floor(Floor &floor) {
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
    Floor floor;
    convert(layout, floor);
    print_floor(floor);
}

void remove_duplicates() {
    unique_configurations.clear();
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

void update_distance(int a_ind, int b_ind, DistMap &dist) {
    int *a = &dist[a_ind * 16];
    int *b = &dist[b_ind * 16];
    for (int i = 0; i < 16; i++) {
        if (*a < *b)
            *b = *a + 1;
        else if (*b < *a)
            *a = *b + 1;
        a++;
        b++;
    }
}

void build_distance(Floor &floor, DistMap &dist) {
    for (int i = 0; i < 16; i++) dist[i * 16 + i] = 0;
    for (int r = 0; r < 16; r++) {
        for (int i = 0; i < 16; i++) {
            if ((floor[i] & 1) == 0) update_distance(i, i - 4, dist);
            if ((floor[i] & 2) == 0) update_distance(i, i + 1, dist);
            if ((floor[i] & 4) == 0) update_distance(i, i + 4, dist);
            if ((floor[i] & 8) == 0) update_distance(i, i - 1, dist);
        }
    }
}

void look(char tile, int dir, int neighbor, int to, DistMap &dist, deque<int> &shortest, int &min) {
    int ind = neighbor * 16 + to;
    if ((tile & dir) == 0) {
        if (dist[ind] < min) {
            shortest.clear();
            shortest.push_back(neighbor);
            min = dist[ind];
        } else if (dist[ind] == min) {
            shortest.push_back(neighbor);
        }
    }
}

int find_clockwise(deque<int> &shortest) {
    return shortest.front();
}

void walk(int from, int to, Floor &floor, DistMap &dist, Heat &heat) {
    int min;
    char tile;
    deque<int> shortest;
    while (from != to) {
        min = 20;
        tile = floor[from];
        look(tile, 1, from - 4, to, dist, shortest, min);
        look(tile, 2, from + 1, to, dist, shortest, min);
        look(tile, 4, from + 4, to, dist, shortest, min);
        look(tile, 8, from - 1, to, dist, shortest, min);
        int next = shortest.size() > 1 ? find_clockwise(shortest) : shortest[0];
        heat[next]++;
        from = next;
    }
}

void generate_heatmap(int layout, Floor &floor) {
    DistMap distance;
    for (int i = 0; i < 256; i++) {
        distance[i] = 20;
    }

    Heat heat;
    for (int i = 0; i < 16; i++) {
        heat[i] = 0;
    }

    build_distance(floor, distance);
    for (int i = 0; i < 16; i++) {
        for (int j = 0; j < 16; j++) {
            walk(i, j, floor, distance, heat);
        }
    }
    
    for (int i = 0; i < 16; i++) {
        if (heat[i] > heat_max) {
            heat_max = heat[i];
            heat_max_layout = layout;
        }
    }
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
        if (visited == 16) {
            valid++;
            generate_heatmap(f, layout);
        }
    }
    cout << valid << " valid unique configurations found" << endl;
}

int main(int argc, char** argv) {
    generate(8);
    remove_duplicates();
    remove_invalid();
    cout << "Hottest tile: " << heat_max << endl;
    print_layout(heat_max_layout);
    return 0;
}