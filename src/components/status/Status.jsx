import React, { useState } from "react";
import { Form } from "react-bootstrap";

import viewIcon from "../assets/view.png";
import deleteIcon from "../assets/delete.png";
import rightIcon from "../assets/right.png";
import wrongIcon from "../assets/cancel.png";
import searchIcon from "../assets/search.png";
import sort from "../assets/sort.png";
import frontIcon from "../assets/front.png";
import backIcon from "../assets/back.png";
import forwardIcon from "../assets/forward.png";
import backwardIcon from "../assets/backward.png";
import "./status.scss";

import {
  useGetStoriesQuery,
  useApproveStoryMutation,
  useDeleteStoryMutation,
} from "../../services/stories";
import AcceptRequest from "../common/accept-modal/AcceptRequest";
import Delete from "../common/delete/Delete";

function Status() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDeleteStory, setSelectedDeleteStory] = useState(null);

  const [deleteStory, { isLoading: isDeleting }] = useDeleteStoryMutation();
  const { data, isLoading, isError } = useGetStoriesQuery({
    page,
    pageSize,
    search,
  });

  const [approveStory, { isLoading: isApproving }] = useApproveStoryMutation();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);

  const stories = data?.stories || [];
  const pagination = data?.pagination || { total: 0, page: 1, pageSize: 10 };

  const handleApprove = async () => {
    if (!selectedStory) return;
    try {
      await approveStory(selectedStory.listenerId).unwrap();
      setShowModal(false);
    } catch (error) {
      console.error("Approval failed:", error);
    }
  };
  const handleDelete = async () => {
    if (!selectedDeleteStory) return;
    try {
      await deleteStory(selectedDeleteStory.id).unwrap();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="status-main">
      <div className="top-section">
        <div className="left-section">
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search User"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // reset page when searching
              }}
            />
            <img src={searchIcon} alt="Search" className="search-icon" />
          </div>
        </div>

        <div className="right-section"></div>
      </div>

      <div className="table">
        <div className="table-headings">
          <div>
            <p className="heading-text">Sr. No</p>
          </div>
          <div>
            <p className="heading-text">
              Listener Name <img className="sort" src={sort} alt="Sort Icon" />
            </p>
          </div>
          <div>
            <p className="heading-text">Upload Time</p>
          </div>
          <div>
            <p className="heading-text">Status</p>
          </div>
          <div>
            <p className="heading-text">Action</p>
          </div>
        </div>

        {isLoading ? (
          <div className="table-body">
            <p>Loading stories...</p>
          </div>
        ) : isError ? (
          <div className="table-body">
            <p>Error fetching stories</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="table-body">
            <p>No stories found</p>
          </div>
        ) : (
          stories.map((story, index) => (
            <div className="table-body" key={story.id}>
              <div>
                <p className="heading-text">
                  {(page - 1) * pageSize + index + 1}
                </p>
              </div>
              <div>
                <p className="heading-text">
                  {story?.listenerStoryData?.display_name || story?.listenerStoryData?.nick_name || "Unknown"}
                </p>
              </div>
              <div>
                <p className="heading-text">
                  {new Date(story.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p
                  className={`heading-text ${
                    story?.is_approved ? "green-text" : "red-text"
                  }`}
                >
                  {story?.is_approved ? "Approved" : "Pending"}
                </p>
              </div>
              <div>
                <div className="actions">
                  {/* View Story */}
                  <a
                    href={story?.story}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src={viewIcon} alt="View Icon" />
                  </a>

                  {/* Approve */}
                  <img
                    src={rightIcon}
                    alt="Approve Story"
                    onClick={() => {
                      setSelectedStory({
                        listenerId: story.listenerId,
                        name:
                          story?.listenerStoryData?.display_name || story?.listenerStoryData?.nick_name || "Unknown",
                      });
                      setShowModal(true);
                    }}
                  />

                  {/* Reject */}
                  {/* <img src={wrongIcon} alt="Reject Story" /> */}

                  {/* Delete */}
                  <img
                    onClick={() => {
                      setSelectedDeleteStory({
                        id: story.id,
                        name:
                          story?.listenerStoryData?.display_name || story?.listenerStoryData?.nick_name || "Unknown",
                      });
                      setShowDeleteModal(true);
                    }}
                    src={deleteIcon}
                    alt="Delete Story"
                  />
                </div>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        <div className="pagination">
          <div className="pagination-dropdown">
            <p>Items Per Pages:</p>
            <Form.Select
              aria-label="Items Per Page"
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setPage(1);
              }}
            >
              {[5, 10, 15, 20, 25, 30].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="pagination-details">
            <div className="pagination-numbers">
              <p>{(page - 1) * pageSize + 1}</p>-
              <p>{Math.min(page * pageSize, pagination.total)}</p>
              <p>of</p>
              <p>{pagination.total}</p>
            </div>
            <div className="pagination-controls">
              <img
                src={backwardIcon}
                alt="First Page"
                onClick={() => setPage(1)}
              />
              <img
                src={backIcon}
                alt="Previous Page"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              />
              <img
                src={frontIcon}
                alt="Next Page"
                onClick={() =>
                  setPage((p) =>
                    p < pagination.totalPages ? p + 1 : pagination.totalPages
                  )
                }
              />
              <img
                src={forwardIcon}
                alt="Last Page"
                onClick={() => setPage(pagination.totalPages)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      <AcceptRequest
        show={showModal}
        onHide={() => setShowModal(false)}
        onConfirm={handleApprove}
        userId={selectedStory?.listenerId}
        userName={selectedStory?.name}
        isMutationLoading={isApproving}
      />
      <Delete
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        userId={selectedDeleteStory?.listenerId}
        userName={selectedDeleteStory?.name}
        isDeleteUserLoading={isDeleting}
        type="Story"
      />
    </div>
  );
}

export default Status;
