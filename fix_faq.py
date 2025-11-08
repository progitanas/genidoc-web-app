#!/usr/bin/env python3
"""
Fix the FAQ section in index.html
Replaces the orphaned Services/Testimonials/Pricing code with GeniDoc FAQ
"""

# Read the FAQ content from faq-section.html
with open('faq-section.html', 'r', encoding='utf-8') as f:
    faq_content = f.read()

# Extract just the FAQ items 2-6 (we already have item 1)
# Remove the wrapper section tags and keep only the items
faq_lines = faq_content.split('\n')

# Find where FAQ Item 2 starts
start_idx = None
for i, line in enumerate(faq_lines):
    if '<!-- FAQ Item 2 -->' in line:
        start_idx = i
        break

# Find where the section ends (look for closing </section>)
end_idx = None
if start_idx:
    for i in range(len(faq_lines) - 1, start_idx, -1):
        if '</section>' in faq_lines[i]:
            end_idx = i
            break

# Extract FAQ items 2-6 plus closing tags
if start_idx and end_idx:
    faq_items_2_to_6 = '\n'.join(faq_lines[start_idx:end_idx])
    print(f"Found FAQ items from line {start_idx} to {end_idx}")
else:
    print(f"ERROR: Could not find FAQ items (start_idx={start_idx}, end_idx={end_idx})")
    exit(1)

# Read index.html
with open('index.html', 'r', encoding='utf-8') as f:
    index_content = f.read()

# Strategy: Find the line with the first FAQ item closing tag and the section closing tag before the accordion FAQ
# Then replace everything in between

# Find the end of FAQ Item 1 in index.html
faq_item_1_end = index_content.find('</div>\n\n            <!-- Cardiologie -->')

if faq_item_1_end == -1:
    print("ERROR: Could not find end of FAQ Item 1")
    exit(1)

# Find the start of the accordion FAQ section
accordion_faq_start = index_content.find('\n        <!-- ============================================================\n         FAQ SECTION (Accordion)')

if accordion_faq_start == -1:
    print("ERROR: Could not find FAQ SECTION (Accordion) comment")
    exit(1)

print(f"FAQ Item 1 ends at: {faq_item_1_end}")
print(f"Accordion FAQ starts at: {accordion_faq_start}")
print(f"Code to replace: {accordion_faq_start - faq_item_1_end} characters")

# Build the replacement: end of FAQ item 1, then FAQ items 2-6, then new line before accordion FAQ
replacement = ''.join(faq_content.split('<section class="faq-section"')[1].split('</section>')[0])

# Actually, simpler approach: just replace from end of item 1 to start of accordion
# with the new FAQ items 2-6

# Construct the new content
new_content = (
    index_content[:faq_item_1_end] +
    '\n' +
    faq_items_2_to_6 +
    '\n' +
    index_content[accordion_faq_start:]
)

# Write back
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ FAQ section replaced successfully!")
print(f"Old line count: {len(index_content.split(chr(10)))}")
print(f"New line count: {len(new_content.split(chr(10)))}")
